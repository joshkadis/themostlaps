const Athlete = require('../schema/Athlete');
const {
  getUpdatedAccessToken,
  shouldRefreshToken,
} = require('../utils/getUpdatedAccessToken');
const fetchStravaAPI = require('../utils/fetchStravaAPI');

/**
 * Confirm that migrated athlete token still works
 * Exit if not
 * */
async function testMigratedAthlete(athleteDoc) {
  let athleteResponse;
  try {
    athleteResponse = await fetchStravaAPI('/athlete', athleteDoc);
  } catch (err) {
    console.log(`❌ fetchStravaAPI failed for athlete ${athleteDoc.get('_id')}`);
    process.exit(0);
  }

  if (!athleteResponse.id || athleteResponse.id !== athleteDoc.get('_id')) {
    console.log(`❌ fetchStravaAPI incorrect response for athlete ${athleteDoc.get('_id')}`);
    console.log(JSON.stringify(athleteResponse, null, 2));
    process.exit(0);
  }
}

function parseJsonArg(inputString, required = true) {
  if (!inputString) {
    if (required) {
      console.error('Missing required JSON input');
      process.exit(0);
    }
    return false;
  }

  try {
    return JSON.parse(inputString);
  } catch (err) {
    console.error(`Malformed JSON input: "${inputString}"`);
    process.exit(0);
  }
}

async function migrateMany(findString, optionsString, isDryRun, forceRefresh = false) {
  const query = parseJsonArg(findString);
  const options = parseJsonArg(optionsString, false) || {};

  let athletes;
  try {
    athletes = await Athlete.find(query, '_id', options);
  } catch (err) {
    console.error(`Athlete.find failed, check input: "${findString}"`);
    process.exit(0);
  }

  if (!athletes.length) {
    console.log(`No results for query: "${findString}"`);
    process.exit(0);
  }

  console.log(`Found ${athletes.length} athletes${"\n"}---------------${"\n"}`);

  let succeeded = 0;
  let failed = 0;
  for (let i = 0; i < athletes.length; i++) {
    console.log(`Migrating athlete: ${JSON.stringify(athletes[i])}`);
    try {
      const didMigrate = await migrateSingle(
        athletes[i]._id,
        isDryRun,
        forceRefresh,
        true, // return instead exiting process
      );
      if (didMigrate) {
        succeeded += 1;
      } else {
        failed += 1;
      }
      console.log("--------------------\n");
    } catch (err) {
      process.exit(1);
    }
  }
  console.log(`Found ${athletes.length}${"\n"}migrated ${succeeded}${"\n"}${failed} errors`);
  process.exit(0);
}

async function migrateSingle(
  athleteId,
  isDryRun,
  forceRefresh = false,
  shouldReturn = false,
) {
  // Conditionally end process
  const maybeExitProcess = () => {
    if (shouldReturn) {
      return;
    }
    process.exit(0);
  };

  // Check that Athlete exists
  const athleteDoc = await Athlete.findById(athleteId);
  if (!athleteDoc) {
    console.log(`❌ Could not locate athlete ${athleteId}`);
    maybeExitProcess();
    return false;
  }

  if (athleteDoc.get('status') === 'deauthorized') {
    console.log(`❌ Athlete ${athleteId} has been deauthorized`);
    maybeExitProcess();
    return false;
  }

  // Check if token has been migrated; refresh if needed
  const refreshToken = athleteDoc.get('refresh_token');
  const expiresAt = athleteDoc.get('expires_at');
  if (expiresAt > 0 && refreshToken.length) {
    if (!forceRefresh) {
      console.log(shouldRefreshToken(expiresAt)
        ? 'Athlete token already migrated but has expired.'
        : 'Athlete token already migrated and has not yet expired.');
    } else {
      console.log('Refreshing access_token');
      if (!isDryRun) {
        const refreshed = await getUpdatedAccessToken(athleteDoc);
        if (refreshed) {
          console.log('Access token successfully refreshed');
        }
      } else {
        console.log('Dry run, exiting.');
      }
    }
    maybeExitProcess();
    return true;
  }

  const oldAccessToken = athleteDoc.get('access_token');
  console.log(`Migrating from access token: ${oldAccessToken}`);

  if (isDryRun) {
    console.log('dry run, exiting');
    maybeExitProcess();
    return true;
  }

  const receivedAccessToken = await getUpdatedAccessToken(athleteDoc, true);
  if (!receivedAccessToken) {
    console.log('❌ getUpdatedAccessToken failed');
    process.exit(0);
  }

  console.log(`Received new access token: ${receivedAccessToken}`);

  const newAthleteDoc = await Athlete.findById(athleteId);
  if (receivedAccessToken === newAthleteDoc.get('access_token')) {
    console.log('✅ Received token matches saved token');
  } else {
    console.log(`❌ Saved token ${newAthleteDoc.get('access_token')} does not match received token`);
    process.exit(0);
  }

  if (newAthleteDoc.get('refresh_token')) {
    const newExpiresAt = newAthleteDoc.get('expires_at');
    const expirationDate = new Date(newExpiresAt * 1000);
    console.log(`✅ Refresh token expires at ${expirationDate.toString()}`);
  } else {
    console.log('❌ Did not receive access token');
    process.exit(0);
  }

  testMigratedAthlete(newAthleteDoc);
  maybeExitProcess();
  return true;
}

module.exports = {
  migrateSingle,
  migrateMany,
};
