const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const { stravaTokenUrl, tokenExpirationTime } = require('../config');
const { slackError } = require('./slackNotification');

/**
  Get athlete's access_token using new authentication pattern
  if athlete has already been migrated to new pattern

  @param {Document} athleteDoc
  @param {Integer} now Optional stub for current time in seconds, for unit testing
  @returns {String|Boolean} The access token or false if error
**/
async function getAccessTokenFromAthleteDoc(athleteDoc, now = null) {
  const tokenObj = athleteDoc.get('migrated_token');

  // Return existing forever token if athlete hasn't been migrated yet
  if (!tokenObj) {
    return athleteDoc.get('access_token');
  }

  const {
    access_token,
    token_type,
    refresh_token,
    expires_at,
  } = tokenObj;

  // Return current access token if it hasn't expired
  const currentTime = now || (Date.now() / 1000);
  const isExpired = currentTime - expires_at < tokenExpirationTime;
  if (!isExpired) {
    return access_token;
  }

  // Fetch new access token and refresh token if needed
  const params = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token,
  };
  const response = await fetch(
    `${stravaTokenUrl}/?${stringify(params)}`,
    { method: 'POST' }
  );

  if (response.status !== 200) {
    slackError(120, {
      id: athleteDoc.get('_id'),
      currentTime,
      expires_at
    });
    return false
  }

  // Update athlete.migrated_token in database
  const responseJson = await response.json();
  athleteDoc.set('migrated_token', Object.assign({}, tokenObj, responseJson));
  await athleteDoc.save();

  return responseJson.access_token;
}

module.exports = {
  getAccessTokenFromAthleteDoc,
};
