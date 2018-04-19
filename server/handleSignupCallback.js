const { stringify } = require('querystring');
const  exchangeCodeForAthleteInfo = require('../utils/ingest/exchangeCodeForAthleteInfo');
const Athlete = require('../schema/Athlete');
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
const subscribeToMailingList = require('../utils/subscribeToMailingList');

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
  sendIngestEmail(athleteDoc, { error: true });
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

  // Create athlete record in database
  let athleteDoc;
  try {
    athleteDoc = await Athlete.create(getAthleteModelFormat(athleteInfo));
    console.log(`Saved ${athleteDoc.get('_id')} to database`);
  } catch (err) {
    // @todo Redirect to rider page if already signed up with notice
    const errCode = -1 !== err.message.indexOf('duplicate key') ? 50 : 55;
    handleSignupError(errCode, athleteInfo.athlete || false);
    return;
  }

  // Maybe subscribe to newsletter
  try {
    // Expect something like '/about|shouldSubscribe'
    const stateParam = req.query.state ?
      decodeURIComponent(req.query.state).split('|') :
      ['/'];

    subscribeToMailingList(
      athleteInfo.athlete.email || 'n/a',
      (stateParam.length > 1 && stateParam[1] === 'shouldSubscribe') // Add to newsletter segment?
    );
  } catch (err) {
    slackError(105, athleteInfo.athlete);
  }

  // Render the welcome page, athlete status will be 'ingesting'
  res.redirect(303, `/welcome?${stringify({
    id: athleteInfo.athlete.id,
    firstname: athleteInfo.athlete.firstname,
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
    const stats = compileStatsForActivities(savedActivities || []);
    const updated = await updateAthleteStats(athleteDoc, stats);
    sendIngestEmail(updated);
    slackSuccess(
      'New signup!',
      getSlackSuccessMessage(updated),
    );

  } catch (err) {
    await handleActivitiesIngestError(athleteDoc, 90);
    return;
  }
}

module.exports = handleSignupCallback;
