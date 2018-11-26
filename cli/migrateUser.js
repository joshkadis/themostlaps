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

const getStatCreateData = (id, key, type, value) => `{
  athlete: {
    connect: {
      strava_id: ${id}
    }
  }
  key: "${key}"
  type: "${type}"
  value: ${value}
}`;

function getStatCreateArgs(user, stats) {
  return Object.keys(stats).map((key) => {
    const stat = stats[key];
    // giro2018 is the only "special" stat we have to worry about
    if (key === 'special' && stat.giro2018) {
      return getStatCreateData(user, 'giro2018', 'special', stat.giro2018);
    }

    // Handle all-time and single-ride totals
    if (key === 'allTime' || key === 'single') {
      return getStatCreateData(user, key, key, stat);
    }

    // Handle month totals
    // Note: Discarding year totals, will replace with custom resolver
    // that adds up monthly totals
    // @todo: Even that can be replaced by query ActivityLaps where
    // Activity is within a date range
    const dateParts = key.split('_').filter(part => part.length);
    if (dateParts.length === 2) {
      return getStatCreateData(user, dateParts.join('_'), 'month', stat);
    } else {
      return null;
    }
  })
    .filter(el => !!el);
}

async function getAthleteDoc(id) {
  const doc = await Athlete.findById(id);
  if (!doc) {
    console.log(`User ${id} was not found in MongoDB`);
    process.exit(0);
  }
  return doc;
}

async function getGqlAthlete(id, fields) {
  const query = await gqlQuery(`query {
    athlete(where: {strava_id: ${id}})
      ${fields}
  }`);
  return query.athlete;
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

async function migrateAthleteStats(user, force) {
  // Check that user's athlete data has been migrated
  const gqlAthlete = await getGqlAthlete(user,`{
    strava_id
      stats {
        key
      }
  }`);

  if (!gqlAthlete) {
    console.log('Migration "athlete" must be run before "stats"');
    process.exit(0);
  }

  // Overwrite existing stats if --force flag is present
  if (gqlAthlete.stats && gqlAthlete.stats.length >= 1) {
    if (!force) {
      console.log(`User ${user} stats have already been migrated. Use --force flag to overwrite`);
      process.exit(0);
    }
    const { deleteManyStats } = await gqlQuery(`mutation {
      deleteManyStats(where: { athlete: { strava_id: 99 } }) {
        count
      }
    }`);
    if (!deleteManyStats.count) {
      console.error('Failed to delete user stats via GraphQL API');
      process.exit(1);
    }
  }

  const athleteDoc = await getAthleteDoc(user);
  const stats = athleteDoc.get('stats');
  const mutationsArgs = getStatCreateArgs(user, stats);

  let statsCreated;
  for (statsCreated = 0; statsCreated < mutationsArgs.length; statsCreated++) {
    const mutation = mutationsArgs[statsCreated];
    const { createStat } = await gqlQuery(`mutation {
      createStat (
        data: ${mutation}
      ) {
        key
        type
        value
      }
    }`);
    if (!createStat) {
      console.log('Failed to create stat');
      console.log(mutation);
      process.exit(1);
    }
  }

  console.log(`Created ${statsCreated} stats for user`);
  process.exit(0);
}

function migrateUser(type, user, force) {
  switch (type) {
    case 'athlete':
      migrateAthleteData(user, force);
      break;

    case 'stats':
      migrateAthleteStats(user, force);
      break;

    // case: 'activities'

    default:
      console.log('Migration type must be one of: athlete, stats, activities');
      process.exit(0);
  }
}

module.exports = migrateUser;
