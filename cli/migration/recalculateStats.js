const { setupConnection } = require('../utils/setupConnection');
const { recalculateAthlete } = require('../athlete/recalculateStats');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');
const Athlete = require('../../schema/Athlete');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';

/**
 * Convert Athlete documents from v1 stats format to v2
 */
async function doCommand({
  dryRun: isDryRun = false,
  limit = 0,
  skip = 0,
}) {
  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  const athletes = await Athlete.find({}, '_id', { limit, skip }).lean();

  const recalcStatsForAthlete = async ({ _id }) => {
    const res = await recalculateAthlete({
      subargs: [_id],
      dryRun: isDryRun,
      verbose: false,
    });
    return { id: _id, res };
  };

  const iterable = makeArrayAsyncIterable(
    athletes,
    recalcStatsForAthlete,
  );

  console.log(`Migrating stats for ${athletes.length} athletes`);

  const migrationResults = {};
  // eslint-disable-next-line
  for await (const { id, res } of iterable) {
    if (!res || res.status !== 'success') {
      console.error(`Recalc failed: ${id}`);
      return;
    }
    const key = res.locations.length
      ? res.locations.join('|')
      : 'none';
    migrationResults[key] = (migrationResults[key] || 0) + 1;
  }
  console.table(migrationResults);

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
