const  exchangeCodeForAthleteInfo = require('../utils/ingest/exchangeCodeForAthleteInfo');

/**
 * Handle OAuth callback from signup
 *
 * @param {Next} app Next.js application
 * @param {Request} req
 * @param {Response} res
 */
async function handleSignupCallback(app, req, res) {
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
    athleteDoc = await createAthlete(athleteInfo);
  } catch (err) {
    // Log and redirect to error page with error code
    return;
  }

  // Render the welcome page, athlete status will be 'ingesting'
  app.render(req, res, '/welcome', Object.assign({...req.query}, athleteInfo));

  // Fetch athlete history

  // Validate and save history

  // Calculate stats and update athlete document
}

module.exports = handleSignupCallback;
