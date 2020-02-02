const { setupConnection } = require('../utils/setupConnection');
const { migrateSingleAthlete } = require('../athlete/migrateStats');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');
const Athlete = require('../../schema/Athlete');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';

/**
 * Redo activities ingestion for a given athlete
 */
async function doCommand({
  dryRun: isDryRun = false, // Currently forcing true in index.js
}) {
  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  const allIds = await Athlete.find(
    { stats_version: 'v1' },
    '_id',
    { lean: true },
  );

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
