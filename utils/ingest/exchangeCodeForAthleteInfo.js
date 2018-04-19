const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const {
  getErrorResponseObject,
} = require('./utils');

/**
 * Get query string for token request with oAuth code
 *
 * @param {String} code
 * @return {String}
 */
function getTokenRequestBody(code) {
  return stringify({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code,
  });
}

/**
 * OAuth exchange from initial authorization callback
 *
 * @param {String} code
 * @return {Object} Raw athlete object from Strava API
 */
async function exchangeCodeForAthleteInfo(code) {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: getTokenRequestBody(code),
    });

    if (200 !== response.status) {
      return getErrorResponseObject(20);
    }

    athlete = await response.json();

    if (!athlete || !athlete.access_token) {
      return getErrorResponseObject(30, athlete);
    }

    return athlete;
  } catch (err) {
    return getErrorResponseObject(40);
  }
}

module.exports = exchangeCodeForAthleteInfo;
