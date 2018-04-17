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
const { slackSuccess } = require('../utils/slackNotification');

/**
 * Handle OAuth callback from signup
 *
 * @param {Next} app Next.js application
 * @param {Request} req
 * @param {Response} res
 */
async function handleSignupCallback(req, res) {
  // Handle request error, most likely error=access_denied
  if (req.query.error) {
    // Log and redirect to error page with error code
    return;
  }

  // Get athlete profile info
  const athleteInfo = await exchangeCodeForAthleteInfo(req.query.code);

  if (athleteInfo.errorCode) {
    // Log and redirect to error page with error code
    return;
  }

  // Create athlete record in database
  let athleteDoc;
  try {
    athleteDoc = await Athlete.create(getAthleteModelFormat(athleteInfo));
  } catch (err) {
    // Log and redirect to error page with error code
    return;
  }

  // Render the welcome page, athlete status will be 'ingesting'
  res.redirect(303, `/welcome?${stringify({
    id: athleteInfo.athlete.id,
    firstname: athleteInfo.athlete.firstname,
  })}`);

  // Fetch athlete history
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
