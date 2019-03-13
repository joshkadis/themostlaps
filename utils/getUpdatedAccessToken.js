const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const {
  stravaOauthUrl,
  tokenExpirationBuffer,
  tokenRefreshGrantType,
} = require('../config');
const { slackError } = require('./slackNotification');
const Athlete = require('../schema/Athlete');

// Compare times in ms to reduce chance of currentTime === canRefreshTime
function shouldRefreshToken(expires_at, now = null) {
  if (!expires_at) {
    return true;
  }
  const currentTime = now ? 1000 * now : Date.now();
  const canRefreshTime = 1000 * (expires_at - tokenExpirationBuffer);
  return currentTime - canRefreshTime > 0;
}

async function refreshAccessToken(access_token, refresh_token, now = null) {
  // Substitute access_token for refresh_token
  // if we don't have a refresh_token, i.e. we're migrating
  const params = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: tokenRefreshGrantType,
    refresh_token: refresh_token ? refresh_token : access_token,
  };

  const response = await fetch(
    `${stravaOauthUrl}/token?${stringify(params)}`,
    { method: 'POST' }
  );

  if (!response || response.status !== 200) {
    const current_time = now || (Date.now() / 1000);
    const responseJson = await response.json();
    const log = Object.assign({}, responseJson, {
      current_time,
    });

    console.log(log);
    slackError(120, log);
    return false;
  }

  return await response.json();
}

/**
  Get athlete's access_token using new authentication pattern
  if athlete has already been migrated to new pattern

  @param {Document} athleteDoc Athlete document
  @param {Boolean} shouldMigrateForeverToken Defaults to false. If true will use forever token to migrate to new auth logic
  @param {Integer} now Optional stub for current time in seconds, for unit testing
  @returns {String|Boolean} access_token or false if error
**/
async function getUpdatedAccessToken(
  athleteDoc,
  shouldMigrateForeverToken = false,
  now = null
) {
  const athlete_id = athleteDoc.get('_id');
  const access_token = athleteDoc.get('access_token');
  const expires_at = athleteDoc.get('expires_at');
  const refresh_token = athleteDoc.get('refresh_token');

  // If token not migrated yet and we're not migrating now
  // or if already migrated and we don't need to refresh
  if (
    (!shouldMigrateForeverToken && !refresh_token) ||
    !shouldRefreshToken(expires_at, now)
  ) {
    return access_token;
  }

  // Now we refresh migrated token or
  // migrate forever token
  let tokenData;
  try {
    tokenData = await refreshAccessToken(access_token, refresh_token, now);
  } catch (err) {
    slackError(120, `Refresh token failed for athlete ${athlete_id}`);
    console.log(err);
    return false;
  }

  if (!tokenData) {
    return false;
  }

  // save tokenData to athleteDoc
  athleteDoc.set(tokenData);
  await athleteDoc.save();

  return tokenData.access_token;
}

module.exports = {
  getUpdatedAccessToken,
  shouldRefreshToken,
};
