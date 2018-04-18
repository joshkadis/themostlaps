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

function createHandleSignupError(res) {
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
    handleSignupError(10, req.query.error)
    return;
  }

  // Get athlete profile info
  const athleteInfo = await exchangeCodeForAthleteInfo(req.query.code);
  if (athleteInfo.errorCode) {
    handleSignupError(athleteInfo.errorCode, athleteInfo);
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

  // Render the welcome page, athlete status will be 'ingesting'
  res.redirect(303, `/welcome?${stringify({
    id: athleteInfo.athlete.id,
    firstname: athleteInfo.athlete.firstname,
  })}`);

  // Fetch athlete history
  let athleteHistory;
  try {
    athleteHistory = await fetchAthleteHistory(athleteDoc);
    if (!athleteHistory || !athleteHistory.length) {
      // Log and redirect to error page with error code
      return;
    }
  } catch (err) {
    // Log and redirect to error page with error code
    return;
  }

  // Validate and save athlete history
  let savedActivities;
  try {
    savedActivities = await saveAthleteHistory(athleteHistory);
  } catch (err) {
    // Log and redirect to error page with error code
    return;
  }

  // Calculate stats and update athlete document
  // Compile and update stats
  try {
    const stats = compileStatsForActivities(savedActivities);
    const updated = await updateAthleteStats(athleteDoc, stats);
    sendIngestEmail(updated);
    slackSuccess(
      'New signup!',
      [
        updated.get('athlete.firstname'),
        updated.get('athlete.lastname'),
        `(${updated.get('_id')})`,
        `${updated.get('stats.allTime')} laps`,
      ].join(' '),
    );

  } catch (err) {
    // Log and redirect to error page with error code
    return;
  }
}

module.exports = handleSignupCallback;
