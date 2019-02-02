const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const { stravaOauthUrl, tokenExpirationBuffer } = require('../config');
const { slackError } = require('./slackNotification');

/**
  Get athlete's access_token using new authentication pattern
  if athlete has already been migrated to new pattern

  @param {Document} athleteDoc
  @param {Integer} now Optional stub for current time in seconds, for unit testing
  @returns {Object|Boolean} Object containing access_token or false if error
**/
async function getAccessTokenFromAthleteDoc(athleteDoc, now = null) {
  const tokenObj = athleteDoc.get('migrated_token');

  // Return existing forever token if athlete hasn't been migrated yet
  if (!tokenObj) {
    return { access_token: athleteDoc.get('access_token') };
  }

  const {
    access_token,
    token_type,
    refresh_token,
    expires_at,
  } = tokenObj;

  // Compare times in ms to reduce chance of currentTime === canRefreshTime
  const currentTime = now ? 1000 * now : Date.now();
  const canRefreshTime = 1000 * (expires_at + tokenExpirationBuffer);
  const shouldRefresh = currentTime - canRefreshTime > 0;
  if (!shouldRefresh) {
    return tokenObj;
  }

  // Fetch new access token and refresh token if needed
  const params = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token,
  };
  const response = await fetch(
    `${stravaOauthUrl}/token?${stringify(params)}`,
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
  const updatedTokenObj = Object.assign({}, tokenObj, responseJson);
  athleteDoc.set('migrated_token', updatedTokenObj);
  await athleteDoc.save();
  return updatedTokenObj;
}

module.exports = {
  getAccessTokenFromAthleteDoc,
};
