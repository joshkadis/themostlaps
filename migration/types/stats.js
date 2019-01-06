const {
  gqlQuery,
  getGqlAthlete,
} = require('../gqlQueries');
const { getAthleteDoc } = require('../helpers');

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
    // @todo: Monthly totals could be replaced by query ActivityLaps where
    // Activity is within a date range then cached somewhere
    const dateParts = key.split('_').filter(part => part.length);
    if (dateParts.length === 2) {
      return getStatCreateData(user, dateParts.join('_'), 'month', stat);
    } else {
      return null;
    }
  })
    .filter(el => !!el);
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

module.exports = migrateAthleteStats;
