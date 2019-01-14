const Athlete = require('../../schema/Athlete');
const {
  gqlQuery,
  getGqlAthlete,
} = require('../gqlQueries');
const { getAthleteDoc } = require('../helpers');

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
    newAthlete = `{
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
    }`;
    return newAthlete;
  } catch (err) {
    return null;
  }
}

async function migrateAthleteData(user, force) {
  const gqlAthlete = await getGqlAthlete(user, '{ strava_id }');
  if (gqlAthlete) {
    if (force) {
      const gqlUserDeleted = await gqlQuery(`mutation {
        deleteAthlete(where: {strava_id: ${user}}) {
            strava_id
        }
      }`);
      if (!gqlUserDeleted.deleteAthlete) {
        console.error('Failed to delete user via GraphQL API');
        process.exit(1);
      }
    } else {
      console.log(`User ${user} already exists on GraphQL server. Use --force flag to overwrite.`)
      process.exit(0);
    }
  }

  const athleteDoc = await getAthleteDoc(user);
  const reformattedAthlete = reformatAthleteSchema(athleteDoc.toJSON());
  if (!reformattedAthlete) {
    console.log('Could not reformat athlete data');
    console.log(athleteDoc.toJSON());
    process.exit(1);
  }

  let athleteCreated;
  athleteCreated = await gqlQuery(`mutation {
    createAthlete(
      data: ${newAthlete}
    ) {
      strava_id
      firstname
      lastname
      email
    }
  }`);

  if (!athleteCreated.createAthlete) {
    console.log('GraphQL createAthlete failed');
    console.log(newAthlete);
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
