const { stringify } = require('querystring');
const  exchangeCodeForAthleteInfo = require('../utils/ingest/exchangeCodeForAthleteInfo');
const Athlete = require('../schema/Athlete');
const MigratedToken = require('../schema/MigratedToken');
const { getAthleteModelFormat } = require('../utils/athleteUtils');
const {
  fetchAthleteHistory,
  saveAthleteHistory,
} = require('../utils/athleteHistory');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../utils/athleteStats');
const { sendIngestEmail } = require('../utils/emails');
const { slackSuccess, slackError } = require('../utils/slackNotification');
const shouldSubscribe = require('../utils/emails/shouldSubscribe');
const refreshAthlete = require('../utils/refreshAthlete');

async function createMigratedToken(athleteInfo) {
  const {
    access_token,
    refresh_token,
    token_type,
    expires_at,
  } = athleteInfo;
  const athlete_id = athleteInfo.athlete.id;
  await MigratedToken.create({
    athlete_id,
    migrated_token: {
      access_token,
      token_type,
      refresh_token,
      expires_at,
    },
  });
}

/**
 * Factory for handling error while creating athlete in db
 *
 * @param {Response}
 * @return {Function}
 */
function createHandleSignupError(res) {

  /**
   * Log error to Slack and redirect to error page
   *
   * @param {Number} errorCode
   * @param {Any} errorAddtlInfo
   */
  return (errorCode = 0, errorAddtlInfo = false) => {
    console.log(`Error ${errorCode} during athlete creation`, errorAddtlInfo);

    slackError(errorCode, errorAddtlInfo);

    // @todo Make this a util getter/setter
    let errorQuery;
    switch (errorCode) {
      case 50:
        errorQuery = { type: 2, id: errorAddtlInfo.id || 0 };
        break;

      default:
        errorQuery = { type: 1 };
    }

    res.redirect(303, `/error?${stringify(errorQuery)}`);
  }
}

/**
 * Handle error during activiities ingest after athlete has been created
 *
 * @param {Document} athleteDoc
 * @param {Number} errorCode
 * @param {Any} errAddtlInfo
 */
async function handleActivitiesIngestError(
  athleteDoc,
  errorCode = 0,
  errorAddtlInfo = false
) {
  // Yay someone signed up!
  slackSuccess(
    'New signup!',
    getSlackSuccessMessage(athleteDoc),
  );

  console.log(`Error ${errorCode} during ingest after athlete creation`, errorAddtlInfo);

  // Boo something broke...
  slackError(
    errorCode,
    Object.assign(
      {},
      athleteDoc.toJSON().athlete,
      errorAddtlInfo ? { errorAddtlInfo } : {},
    ),
  );

  // Update status
  athleteDoc.set('status', 'error');
  await athleteDoc.save();

  // Welcome...
  // @note Disabled after Strava API change, Jan 2019
  // sendIngestEmail(athleteDoc, { error: true });
}

/**
 * Get text for Slack success message from document
 *
 * @param {Document} athleteDoc
 * @return {String}
 */
function getSlackSuccessMessage(athleteDoc) {
  return [
    athleteDoc.get('athlete.firstname'),
    athleteDoc.get('athlete.lastname'),
    `(${athleteDoc.get('_id')})`,
    `${athleteDoc.get('stats.allTime') || 0} laps`,
  ].join(' ');
}

/**
 * Handle OAuth callback from signup
 *
 * @param {Next} app Next.js application
 * @param {Request} req
 * @param {Response} res
 */
async function handleSignupCallback(req, res) {
  const handleSignupError = createHandleSignupError(res);

  // Handle request error, most likely error=access_denied
  if (req.query.error) {
    handleSignupError(10, req.query)
    return;
  }

  // Get athlete profile info
  const athleteInfo = await exchangeCodeForAthleteInfo(req.query.code);
  if (athleteInfo.errorCode) {
    handleSignupError(athleteInfo.errorCode, athleteInfo.athlete || false);
    return;
  }

  // Create athlete record in database or update access_token
  let athleteDoc;
  try {
    // @note Use new token refresh logic
    const existingAthleteDoc = await Athlete.findById(athleteInfo.athlete.id);
    if (existingAthleteDoc &&
      athleteInfo.access_token !== existingAthleteDoc.get('access_token')
    ) {
      // Update access_token and refresh athlete activities + stats
      console.log(`Updating access token for ${getSlackSuccessMessage(existingAthleteDoc)}`);
      existingAthleteDoc.set('access_token', athleteInfo.access_token)
      const updatedAthleteDoc = await existingAthleteDoc.save();
      res.redirect(303, `/rider/${athleteInfo.athlete.id}?updated=1`);
      await refreshAthlete(updatedAthleteDoc);
      console.log(`Updated access token for ${getSlackSuccessMessage(updatedAthleteDoc)}`);
      slackSuccess('Updated access token', getSlackSuccessMessage(updatedAthleteDoc));
      return;
    }

    athleteDoc = await Athlete.create(
      getAthleteModelFormat(athleteInfo, shouldSubscribe(req.query))
    );
    console.log(`Saved ${athleteDoc.get('_id')} to database`);
  } catch (err) {
    const errCode = -1 !== err.message.indexOf('duplicate key') ? 50 : 55;
    console.log(err, athleteInfo);
    handleSignupError(errCode, athleteInfo.athlete || false);
    return;
  }

  // Create MigratedToken document
  try {
    await createMigratedToken(athleteInfo);
  } catch (err) {
    console.log(err);
    handleSignupError(130, Object.assign({ process: 'handleSignupCallback' }, req.query));
    return;
  }

  // Render the welcome page, athlete status will be 'ingesting'
  res.redirect(303, `/welcome?${stringify({
    id: athleteInfo.athlete.id,
  })}`);

  // Fetch athlete history
  let athleteHistory;
  try {
    athleteHistory = await fetchAthleteHistory(athleteDoc);
  } catch (err) {
    await handleActivitiesIngestError(athleteDoc, 70);
    return;
  }

  // Validate and save athlete history
  let savedActivities;
  if (athleteHistory && athleteHistory.length) {
    try {
      savedActivities = await saveAthleteHistory(athleteHistory);
    } catch (err) {
      await handleActivitiesIngestError(athleteDoc, 80);
      return;
    }
  }

  // Calculate stats and update athlete document
  // Compile and update stats
  try {
    const stats = await compileStatsForActivities(savedActivities || []);
    const updated = await updateAthleteStats(athleteDoc, stats);
    // @note Disabled after Strava API change, Jan 2019
    // sendIngestEmail(updated);
    const successMessage = getSlackSuccessMessage(updated);
    console.log(`New signup: ${successMessage}`);
    slackSuccess('New signup!', successMessage);

  } catch (err) {
    await handleActivitiesIngestError(athleteDoc, 90);
    return;
  }
}

module.exports = handleSignupCallback;
