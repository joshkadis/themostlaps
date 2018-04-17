const { stringify } = require('querystring');
const  exchangeCodeForAthleteInfo = require('../utils/ingest/exchangeCodeForAthleteInfo');
const Athlete = require('../schema/Athlete');
const { getAthleteModelFormat } = require('../utils/athleteUtils');

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
  console.log('here');

  // Validate and save history

  // Calculate stats and update athlete document
}

module.exports = handleSignupCallback;
