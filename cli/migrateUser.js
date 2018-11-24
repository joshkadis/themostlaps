const Athlete = require('../schema/Athlete');
const gqlQuery = require('../migration/gqlQuery');

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

  try {
    newAthlete = `{
      access_token: "${oldSchema.access_token}"
      email: "${oldSchema.athlete.email || ''}"
      firstname: "${oldSchema.athlete.firstname}"
      last_refreshed: ${Math.floor(Date.now() / 1000)}
      lastname: "${oldSchema.athlete.lastname}"
      migrated_athlete: true
      notifications: ${notifications ? 'true' : 'false'}
      photo: "${oldSchema.athlete.profile}"
      status: "${oldSchema.status || 'migrating'}"
      strava_id: ${oldSchema._id}
    }`;
    return newAthlete;
  } catch (err) {
    return null;
  }
}

async function migrateUser(user, force) {
  const gqlUser = await gqlQuery(`query {
    athlete(where: {strava_id: ${user}}) {
        strava_id
    }
  }`);

  if (gqlUser.athlete) {
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

  const athleteDoc = await Athlete.findById(user);
  if (!athleteDoc) {
    console.log(`User ${user} was not found in MongoDB`)
    process.exit(0);
  }

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

module.exports = migrateUser;
