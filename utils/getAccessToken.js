const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const { stravaOauthUrl, tokenExpirationBuffer } = require('../config');
const { slackError } = require('./slackNotification');
const MigratedToken = require('../schema/MigratedToken');

// Compare times in ms to reduce chance of currentTime === canRefreshTime
function shouldRefreshToken(expires_at, now = null) {
  const currentTime = now ? 1000 * now : Date.now();
  const canRefreshTime = 1000 * (expires_at + tokenExpirationBuffer);
  return currentTime - canRefreshTime > 0;
}

async function createOrUpdateMigratedToken(migratedTokenDoc, dataToSave, athleteId) {
  let success = true;

  if (migratedTokenDoc) {
    migratedTokenDoc.set('migrated_token', dataToSave);

    try {
      await migratedTokenDoc.save();
    } catch (err) {
      console.log(err);
      success = false;
    }

  } else {
    try {
      await MigratedToken.create(dataToSave);
    } catch (err) {
      console.log(err);
      success = false;
    }
  }

  if (!success) {
    slackError(130, {
      athleteId,
    });
  }
  return success;
}

/**
  Get athlete's access_token using new authentication pattern
  if athlete has already been migrated to new pattern

  @param {Document} athleteDoc Athlete document
  @param {Boolean} shouldMigrateForeverToken Defaults to false. If true will use forever token to migrate to new auth logic
  @param {Integer} now Optional stub for current time in seconds, for unit testing
  @returns {Object|Boolean} Object containing access_token or false if error
**/
async function getAccessToken(
  athleteDoc,
  shouldMigrateForeverToken = false,
  now = null
) {
  const athlete_id = athleteDoc.get('_id');
  const forever_access_token = athleteDoc.get('access_token');

  const migratedTokenDoc = await MigratedToken.findOne({ athlete_id });

  // If token not migrated yet and we're not migrating now
  if (!migratedTokenDoc && !shouldMigrateForeverToken) {
    return { access_token: forever_access_token };
  }

  const isMigratingToken = !migratedTokenDoc && shouldMigrateForeverToken;
  let migratedTokenObj;

  if (migratedTokenDoc) {
    // Token already migrated
    migratedTokenObj = migratedTokenDoc.get('migrated_token');
    if (!shouldRefreshToken(migratedTokenObj.expires_at, now)) {
      // Token doesn't need to be refreshed
      return migratedTokenObj;
    }
  } else {
    // Mock token object if we're migrating now
    migratedTokenObj = {
      refresh_token: forever_access_token,
      access_token: '',
      token_type: '',
      expires_at: 0,
    };
  }

  const {
    access_token,
    token_type,
    refresh_token,
    expires_at,
  } = migratedTokenObj;

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
    current_time = now || (Date.now() / 1000);
    console.log(response);
    process.exit(1);
    slackError(120, {
      athlete_id,
      current_time,
      expires_at
    });
    return false
  }

  // Update athlete.migrated_token in database
  const responseJson = await response.json();
  const updatedTokenObj = Object.assign({}, migratedTokenObj, responseJson);

  const dataToSave = !isMigratingToken ? updatedTokenObj : {
    athlete_id,
    forever_access_token,
    migrated_token: updatedTokenObj,
  };

  const success = await createOrUpdateMigratedToken(
    !isMigratingToken ? migratedTokenDoc : false,
    dataToSave
  );

  athleteDoc.set('did_migrate_token', success);
  await athleteDoc.save();

  return updatedTokenObj;
}

module.exports = {
  getAccessToken,
};
