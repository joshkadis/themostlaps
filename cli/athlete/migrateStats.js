const _cloneDeep = require('lodash/cloneDeep');
const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const Athlete = require('../../schema/Athlete');
const { transformStats } = require('../../utils/v2/stats/transformStats');
const { getAthleteIdentifier } = require('../../utils/v2/models/athleteHelpers');

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
  if (!checkNumArgs(subargs, 1, '<atleteId>')) {
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

  const v2Stats = await transformStats(
    _cloneDeep(athleteDoc.stats),
    athleteId,
  );

  if (verbose) {
    console.log(`-----------------
Migration successful: ${getAthleteIdentifier(athleteDoc)}
All-time PP laps: ${v2Stats.locations.prospectpark.allTime}
Number PP Activitie: ${v2Stats.locations.prospectpark.numActivities}`);
  }


  athleteDoc.set({
    // legacyStats,
    stats_version: 'v2',
    stats: v2Stats,
    migration: {
      ...(athleteDoc.migration || {}),
      athleteStats: true,
    },
  });

  athleteDoc.markModified('migration');
  athleteDoc.markModified('legacyStats');
  athleteDoc.markModified('stats');
  if (!isDryRun) {
    await athleteDoc.save();
  }

  if (isDryRun && verbose) {
    console.log(DRY_RUN_MSG);
  }

  return {
    status: 'Success',
    athleteId,
  };
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
  migrateSingleAthlete: doCommand,
};
