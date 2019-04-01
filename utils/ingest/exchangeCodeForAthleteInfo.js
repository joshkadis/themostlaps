const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const {
  getErrorResponseObject,
} = require('./utils');
const {
  stravaOauthUrl,
} = require('../../config')

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
    const response = await fetch(`${stravaOauthUrl}/token`, {
      method: 'POST',
      body: getTokenRequestBody(code),
    });

    if (200 !== response.status) {
      return getErrorResponseObject(20);
    }

    const tokenExchangeResponse = await response.json();

    // @note Use new token refresh logic
    if (!tokenExchangeResponse || !tokenExchangeResponse.access_token) {
      return getErrorResponseObject(30, tokenExchangeResponse);
    }

    return tokenExchangeResponse;
  } catch (err) {
    return getErrorResponseObject(40);
  }
}

module.exports = exchangeCodeForAthleteInfo;
