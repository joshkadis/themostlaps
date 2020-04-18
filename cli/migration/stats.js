const { setupConnection } = require('../utils/setupConnection');
const { migrateSingleAthlete } = require('../athlete/migrateStats');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');
const Athlete = require('../../schema/Athlete');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';

/**
 * Convert Athlete documents from v1 stats format to v2
 */
async function doCommand({
  dryRun: isDryRun = false,
  limit = 0,
}) {
  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  const allIds = await Athlete.find(
    { stats_version: { $ne: 'v2' } },
    '_id',
    {
      lean: true,
      limit,
      sort: {
        _id: 1,
      },
    },
  );

  if (!allIds.length) {
    console.log('No athletes found without v2 stats');
    return;
  }

  const migrateStatsForAthlete = async (athleteId) => {
    console.log(`Migrating ${athleteId}`);
    return migrateSingleAthlete({
      subargs: [athleteId],
      dryRun: isDryRun,
      verbose: false,
    });
  };

  const iterable = makeArrayAsyncIterable(
    allIds.map(({ _id }) => _id),
    migrateStatsForAthlete,
  );

  console.log(`Migrating stats for ${allIds.length} athletes`);

  const results = {
    Success: 0,
  };

  // eslint-disable-next-line
  for await (const result of iterable) {
    const {
      status = 'Unknown',
      athleteId = 0,
    } = result;

    if (status === 'Success') {
      results.Success += 1;
    } else {
      results[status] = results[status] || [];
      results[status].push(athleteId);
    }
  }
  console.table(results);

  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
