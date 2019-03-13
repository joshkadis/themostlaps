const Athlete = require('../schema/Athlete');
const {
  getAccessToken,
  shouldRefreshToken,
} = require('../utils/getAccessToken');

async function migrateSingle(athleteId, isDryRun) {
    // Check that Athlete exists
    const athleteDoc = await Athlete.findById(athleteId);
    if (!athleteDoc) {
      console.log(`Could not locate athlete ${athleteId}`);
      process.exit(0);
    }

    // Confirm not already migrated
    const refreshToken = athleteDoc.get('refresh_token');
    const expiresAt = athleteDoc.get('expires_at');
    if (expiresAt > 0 && refreshToken.length) {
      console.log(shouldRefreshToken(expiresAt) ?
        'Athlete token already migrated but has expired.' :
        'Athlete token already migrated and has not yet expired.'
      );
      process.exit(0);
    }

    const oldAccessToken = athleteDoc.get('access_token');
    console.log(`Migrating from access token: ${oldAccessToken}`);

    if (isDryRun) {
      console.log('dry run, exiting');
      process.exit(0);
    }

    const receivedAccessToken = await getAccessToken(athleteDoc, true);
    if (!receivedAccessToken) {
      console.log('getAccessToken failed')
      process.exit(0)
    }

    console.log(`Received new access token: ${receivedAccessToken}`);

    const newAthleteDoc = await Athlete.findById(athleteId);
    console.log(receivedAccessToken === newAthleteDoc.get('access_token') ?
      'Received token matches saved token' :
      `Saved token ()${newAthleteDoc.get('refresh_token')}) does not match received token`
    );

    const newExpiresAt = newAthleteDoc.get('expires_at');
    const expirationDate = new Date(newExpiresAt * 1000);
    console.log(`Refresh token expires at ${expirationDate.toString()}`);

    process.exit(0);
}

function migrateAll(isDryRun) {
  console.log('TO DO');
  process.exit(0);
}

module.exports = {
  migrateSingle,
  migrateAll,
};
