const fetch = require('isomorphic-unfetch');
const {
  tokenExpirationBuffer,
} = require('../config');
const { captureSentry } = require('./v2/services/sentry');

async function maybeDeauthorizeAthlete(responseData, status, athleteDoc) {
  let shouldDeauthorize = status === 401;
  if (!shouldDeauthorize) {
    const { errors = [] } = responseData;
    const invalidTokens = errors.filter(
      ({ resource = false, code = false }) => resource === 'RefreshToken' && code === 'invalid',
    );
    shouldDeauthorize = !!invalidTokens.length;
  }

  if (shouldDeauthorize) {
    athleteDoc.set('status', 'deauthorized');
    await athleteDoc.save();
    return true;
  }
  return false;
}

// Compare times in ms to reduce chance of currentTime === canRefreshTime
function shouldRefreshToken(expires_at, now = null) {
  if (!expires_at) {
    return true;
  }
  const currentTime = now ? 1000 * now : Date.now();
  const canRefreshTime = 1000 * (expires_at - tokenExpirationBuffer);
  return currentTime - canRefreshTime > 0;
}

const obfuscateToken = (token) => token.replace(/^\w{15}/, '***************');

async function refreshAccessToken(
  access_token,
  refresh_token = null,
  athleteDoc = null,
) {
  const athlete_id = athleteDoc ? athleteDoc.get('_id') : null;

  // Substitute access_token for refresh_token
  // if we don't have a refresh_token, i.e. we're migrating

  let response;
  try {
    response = await fetch('https://kadisco.com');
  } catch (err) {
    captureSentry(err, 'refreshAccessToken', {
      extra: {
        athlete_id,
        refresh_token: obfuscateToken(refresh_token),
        access_token: obfuscateToken(access_token),
        action: 'fetch failed',
      },
    });
    return false;
  }

  const responseStatus = response.status;
  if (!response || responseStatus !== 200) {
    const responseJson = await response.json();

    await maybeDeauthorizeAthlete(responseJson, responseStatus, athleteDoc);

    captureSentry('Could not refresh athlete access_token', 'refreshAccessToken', {
      extra: {
        ...responseJson,
        athlete_id,
        refresh_token: obfuscateToken(refresh_token),
        access_token: obfuscateToken(access_token),
        action: 'fetch returned invalid status',
      },
    });
    return false;
  }

  const refreshedResponse = await response.json();

  if (refresh_token
    && refresh_token !== refreshedResponse.refresh_token
  ) {
    // captureSentry('refresh_token changed', 'refreshAccessToken', {
    //   level: 'info',
    //   extra: {
    //     athleteId: athlete_id,
    //     prevRefreshToken: obfuscateToken(refresh_token),
    //     nextRefreshToken: obfuscateToken(refreshedResponse.refresh_token),
    //   },
    // });
  }
  return refreshedResponse;
}

/**
 * Get athlete's access_token using new authentication pattern
 * if athlete has already been migrated to new pattern
 *
 * @param {Document} athleteDoc Athlete document
 * @param {Boolean} shouldMigrateForeverToken Defaults to false. If true will use forever token to migrate to new auth logic
 * @param {Integer} now Optional stub for current time in seconds, for unit testing
 * @returns {String|Boolean} access_token or false if error
 */
async function getUpdatedAccessToken(
  athleteDoc,
  shouldMigrateForeverToken = false,
  now = null,
) {
  const athlete_id = athleteDoc.get('_id');
  const access_token = athleteDoc.get('access_token');
  const expires_at = athleteDoc.get('expires_at');
  const refresh_token = athleteDoc.get('refresh_token');

  // If token not migrated yet and we're not migrating now
  if (!refresh_token && !shouldMigrateForeverToken) {
    return access_token;
  }

  // if already migrated and we don't need to refresh
  if (!shouldRefreshToken(expires_at, now)) {
    return access_token;
  }

  // Now we refresh migrated token or
  // migrate forever token
  let tokenData;
  try {
    tokenData = await refreshAccessToken(
      access_token,
      refresh_token,
      athleteDoc,
    );
  } catch (err) {
    captureSentry(err, 'refreshAccessToken', {
      extra: {
        athleteId: athleteDoc.id,
        action: 'function return',
      },
    });
    return false;
  }

  if (!tokenData) {
    return false;
  }

  // save tokenData to athleteDoc
  athleteDoc.set(tokenData);
  await athleteDoc.save();

  // Log if there was no refresh_token and we had to migrate
  if (!refresh_token) {
    console.log(`Migrated access_token for athlete ${athlete_id}`);
  }

  return tokenData.access_token;
}

module.exports = {
  getUpdatedAccessToken,
  shouldRefreshToken,
  refreshAccessToken,
  maybeDeauthorizeAthlete,
};
