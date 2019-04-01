const Athlete = require('../schema/Athlete');
const {
  getUpdatedAccessToken,
  shouldRefreshToken,
} = require('../utils/getUpdatedAccessToken');

async function migrateSingle(athleteId, isDryRun, forceRefresh = false) {
    // Check that Athlete exists
    const athleteDoc = await Athlete.findById(athleteId);
    if (!athleteDoc) {
      console.log(`❌ Could not locate athlete ${athleteId}`);
      process.exit(0);
    }

    // Confirm not already migrated
    const refreshToken = athleteDoc.get('refresh_token');
    const expiresAt = athleteDoc.get('expires_at');
    if (expiresAt > 0 && refreshToken.length) {
      if (!forceRefresh) {
        console.log(shouldRefreshToken(expiresAt) ?
          'Athlete token already migrated but has expired.' :
          'Athlete token already migrated and has not yet expired.'
        );
      } else {
        console.log('Refreshing access_token');
        if (!isDryRun) {
          const refreshed = await getUpdatedAccessToken(athleteDoc);
          if (refreshed) {
            console.log('Access token successfully refreshed');
          }
        } else {
          console.log('Dry run, exiting.')
        }
      }
      process.exit(0);
    }

    const oldAccessToken = athleteDoc.get('access_token');
    console.log(`Migrating from access token: ${oldAccessToken}`);

    if (isDryRun) {
      console.log('dry run, exiting');
      process.exit(0);
    }

    const receivedAccessToken = await getUpdatedAccessToken(athleteDoc, true);
    if (!receivedAccessToken) {
      console.log('❌ getUpdatedAccessToken failed')
      process.exit(0)
    }

    console.log(`Received new access token: ${receivedAccessToken}`);

    const newAthleteDoc = await Athlete.findById(athleteId);
    console.log(receivedAccessToken === newAthleteDoc.get('access_token') ?
      '✅ Received token matches saved token' :
      `❌ Saved token ()${newAthleteDoc.get('refresh_token')}) does not match received token`
    );

    const newExpiresAt = newAthleteDoc.get('expires_at');
    const expirationDate = new Date(newExpiresAt * 1000);
    console.log(`✅ Refresh token expires at ${expirationDate.toString()}`);

    process.exit(0);
}

module.exports = {
  migrateSingle,
};
