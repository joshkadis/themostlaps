require('isomorphic-fetch');
const { createAthlete } = require('../utils/athleteUtils');
const {
  fetchAthleteHistory,
  saveAthleteHistory,
} = require('../utils/athleteHistory');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../utils/athleteStats');
const getInternalErrorMessage = require('../utils/internalErrors');

/**
 * Get query string for token request with oAuth code
 *
 * @param {String} code
 * @return {String}
 */
function getTokenRequestBody(code) {
  return [
    `client_id=${process.env.CLIENT_ID}`,
    `client_secret=${process.env.CLIENT_SECRET}`,
    `code=${code}`,
  ].join('&');
}

/**
 * Get response object for error code
 *
 * @param {Number} code
 * @param {Any} errData Optional error data
 * @param {Object} athlete Optional athlete data if we have it
 * @return {Object}
 */
function getErrorResponseObject(code, errData = null, athlete = false) {
  return {
    error: code,
    errorMsg: getInternalErrorMessage(code, errData),
    athlete,
  }
}

/**
 * Handle post-authorization callback
 * @param {Request} req
 * @param {Response} res
 * @return {Object} result
 * @return {Number|Bool} result.error Internal error code or false
 * @return {String} result.errorMsg
 * @return {Object} result.athlete Athlete info for onboarding next steps
 */
module.exports = async (req, res) => {
  if (req.query.error) {
    return getErrorResponseObject(1, req.query.error);
  }

  // Authenticate
  let athlete;
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: getTokenRequestBody(req.query.code),
    });

    if (200 !== response.status) {
      console.log(response);
      return getErrorResponseObject(2);
    }

    athlete = await response.json();

    if (!athlete || !athlete.access_token) {
      console.log(athlete);
      return getErrorResponseObject(3);
    }
  } catch (err) {
    console.log(err);
    return getErrorResponseObject(4);
  }

  // Create athlete in database
  let athleteDoc;
  try {
    athleteDoc = await createAthlete(athlete);
    console.log(`Saved ${athleteDoc.get('_id')} to database`);
  } catch (err) {
    console.log(err);
    return getErrorResponseObject(5);
  }

  // Fetch athlete history
  let athleteHistory;
  try {
    athleteHistory = await fetchAthleteHistory(athleteDoc);
    if (!athleteHistory || !athleteHistory.length) {
      return getErrorResponseObject(6);
    }
  } catch (err) {
    console.log(err);
    return getErrorResponseObject(7);
  }

  // Validate and save athlete history
  let savedActivities;
  try {
    savedActivities = await saveAthleteHistory(athleteHistory);
  } catch (err) {
    console.log(err);
    return getErrorResponseObject(8);
  }

  // Compile and update stats
  try {
    const stats = compileStatsForActivities(savedActivities);
    const updated = await updateAthleteStats(athleteDoc, stats);
    return {
      error: false,
      errorMsg: '',
      athlete: {
        id: athleteDoc.get('_id');
        firstname: athleteDoc.get('athlete.firstname'),
        email: athleteDoc.get('athlete.email'),
        allTime: athleteDoc.get('stats.allTime'),
      }
    }
  } catch (err) {
    console.log(err);
    return getErrorResponseObject(9);
  }
};