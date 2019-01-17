const prettier = require('prettier');
const {
  gqlQuery,
  getGqlAthlete,
} = require('../gqlQueries');
const {
  getAthleteDoc,
  checkIfExists,
} = require('../helpers');
const { getStatCreateArgs } = require('./stats');

function reformatAthleteSchema(oldSchema) {
  // rough validation check;
  if (!oldSchema.athlete || !oldSchema._id || !oldSchema.access_token) {
    return null;
  }

  // try/catch instead of testing every level here
  let notifications;
  try {
    notifications = oldSchema.preferences.notifications.monthly;
  } catch (err) {
    notifications = true;
  }

  const lastRefreshed = new Date(oldSchema.last_refreshed * 1000);

  try {
    const newAthlete = `{
      access_token: "${oldSchema.access_token}"
      email: "${oldSchema.athlete.email || ''}"
      firstname: "${oldSchema.athlete.firstname}"
      last_refreshed: "${lastRefreshed.toISOString()}"
      lastname: "${oldSchema.athlete.lastname}"
      migrated_athlete: true
      notifications: ${notifications ? 'true' : 'false'}
      photo: "${oldSchema.athlete.profile}"
      status: "${oldSchema.status || 'migration'}"
      strava_id: ${oldSchema._id}
      stats: {
        create: [${getStatCreateArgs(null, oldSchema.stats, false).join(',')}]
      }
    }`;
    return newAthlete;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function migrateAthleteData(migrate_id, force) {
  await checkIfExists(
    migrate_id,
    (migrate_id) => getGqlAthlete(migrate_id, '{ strava_id }'),
    force,
    `mutation {
      deleteAthlete(where: {strava_id: ${migrate_id}}) {
          strava_id
      }
    }`,
    'deleteAthlete',
    'Athlete'
  );

  const athleteDoc = await getAthleteDoc(migrate_id);
  const reformattedAthlete = reformatAthleteSchema(athleteDoc.toJSON());
  if (!reformattedAthlete) {
    console.log('Could not reformat athlete data');
    console.log(athleteDoc.toJSON());
    process.exit(1);
  }

  const athleteCreated = await gqlQuery(`mutation {
    createAthlete(
      data: ${reformattedAthlete}
    ) {
      strava_id
      firstname
      lastname
      email
    }
  }`);

  if (!athleteCreated.createAthlete) {
    console.log('GraphQL createAthlete failed');
    console.log(reformattedAthlete);
    process.exit(1);
  }

  const {
    strava_id,
    firstname,
    lastname,
  } = athleteCreated.createAthlete;
  console.log(`Created athlete ${strava_id} | ${firstname} ${lastname}`);

  process.exit(0);
}

module.exports = migrateAthleteData;
