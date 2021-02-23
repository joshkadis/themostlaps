const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const Athlete = require('../../schema/Athlete');
const { getAthleteIdentifier } = require('../../utils/v2/models/athleteHelpers');
const {
  generateLocationsStatsV2,
} = require('../../utils/v2/stats/generateStatsV2');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete migratestats');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';
/**
 * Migrate an athlete from v1 to v2 stats format
 */
async function doCommand({
  subargs,
  dryRun: isDryRun = false,
  verbose = true,
}) {
  if (!checkNumArgs(subargs, 1, '<athleteId>')) {
    return false;
  }
  if (isDryRun && verbose) {
    console.log(DRY_RUN_MSG);
  }

  const athleteId = subargs[0];
  const athleteDoc = await Athlete.findById(athleteId);
  if (!athleteDoc) {
    if (verbose) {
      console.log(`Athlete ${athleteId} not found`);
    }
    return {
      status: 'Not found',
      athleteId,
    };
  }

  if (athleteDoc.stats_version !== 'v2') {
    if (verbose) {
      console.log(`-----------------
Not yet migrated to v2: ${getAthleteIdentifier(athleteDoc)}`);
    }
    return {
      status: 'V1 stats',
      athleteId,
    };
  }

  const nextStats = await generateLocationsStatsV2(athleteDoc);
  athleteDoc.set({
    stats: nextStats,
    locations: undefined,
    migration: {
      ...(athleteDoc.migration || {}),
      recalculateStats: true,
    },
  });

  athleteDoc.markModified('stats');
  athleteDoc.markModified('migration');
  if (!isDryRun) {
    await athleteDoc.save();
  }

  console.log(
    `Locations for ${getAthleteIdentifier(athleteDoc)}: ${Object.keys(athleteDoc.stats.locations).join(', ')}`,
  );

  if (isDryRun && verbose) {
    console.log(DRY_RUN_MSG);
  }

  return {
    status: 'success',
    locations: Object.keys(athleteDoc.stats.locations),
    athleteId,
  };
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
  recalculateAthlete: doCommand,
};
