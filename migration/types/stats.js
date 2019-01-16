const {
  gqlQuery,
  getGqlAthlete,
} = require('../gqlQueries');
const { getAthleteDoc } = require('../helpers');

/**
  Get gql query for a specific stat
**/
const getStatCreateData = (userId, key, type, value, shouldConnectAthlete = true) =>
`{
  ${shouldConnectAthlete ?
    `athlete: {
      connect: {
        strava_id: ${userId}
      }
    }` : ''
  }
  key: "${key}"
  type: "${type}"
  value: ${value}
}`;

/**
  Create array of gql queries for each individual stat *except* years
  Note: Discarding year totals, will replace with custom resolver
  that adds up monthly totals
  @todo: Monthly totals could be replaced by query ActivityLaps where
  Activity is within a date range then cached somewhere
**/
function getStatCreateArgs(userId, stats, shouldConnectAthlete = true) {
  // use reduce instead of map because special contains giro2018 and cold2019
  return Object.keys(stats).reduce((acc, key) => {
    const stat = stats[key];
    let statData;

    if (key === 'special') {
      if (stat.giro2018) {
        statData = getStatCreateData(userId, 'giro2018', 'special', stat.giro2018, shouldConnectAthlete);
      }
      if (stat.cold2019) {
        statData = getStatCreateData(userId, 'cold2019', 'special', stat.cold2019, shouldConnectAthlete);
      }
    } else if (key === 'allTime' || key === 'single') {
      statData = getStatCreateData(userId, key, key, stat, shouldConnectAthlete);
    } else {
      const dateParts = key.split('_').filter(part => part.length);
      // don't migrate year since we'll get that by adding up months
      if (dateParts.length === 2) {
        statData = getStatCreateData(userId, dateParts.join('_'), 'month', stat, shouldConnectAthlete);
      }
    }

    return [...acc, statData];
  }, []);
}

/**
  Migrate all stats for Athlete by id
**/
async function migrateAthleteStats(userId, force) {
  // Check that user's athlete data has been migrated
  const gqlAthlete = await getGqlAthlete(userId,`{
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
      console.log(`User ${userId} stats have already been migrated. Use --force flag to overwrite`);
      process.exit(0);
    }
    const { deleteManyStats } = await gqlQuery(`mutation {
      deleteManyStats(where: { athlete: { strava_id: 99 } }) {
        count
      }
    }`);
    if (!deleteManyStats.count) {
      console.error('Failed to delete userId stats via GraphQL API');
      process.exit(1);
    }
  }

  const athleteDoc = await getAthleteDoc(userId);
  const stats = athleteDoc.get('stats');
  const mutationsArgs = getStatCreateArgs(userId, stats, true);

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

module.exports = {
  migrateAthleteStats,
  getStatCreateArgs,
};
