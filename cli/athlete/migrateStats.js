const _cloneDeep = require('lodash/cloneDeep');
const _unset = require('lodash/unset');
const _isEqual = require('lodash/isEqual');
const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const Athlete = require('../../schema/Athlete');
const { transformStats } = require('../../utils/v2/stats/transformStats');
const { getAthleteIdentifier } = require('../../utils/v2/models/athleteHelpers');
const {
  getDefaultV2Stats,
  getDefaultLocationStats,
} = require('../../utils/v2/stats/utils');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete migratestats');

function getLegacyStatsTest(stats) {
  const {
    allTime,
    single,
  } = stats;
  const byYear = {};
  const availableYears = [];

  Object.keys(stats).forEach((key) => {
    const matches = /^_(\d{4})$/.exec(key);
    if (!matches) {
      return;
    }
    // output.byYear.2014 = stats._2014
    byYear[matches[1]] = stats[key];
    availableYears.push(Number(matches[1]));
  });

  const location = getDefaultLocationStats({
    allTime,
    single,
    availableYears,
    byYear,
  });

  _unset(location, 'byMonth');
  _unset(location, 'numActivities');

  const fullStats = getDefaultV2Stats({
    availableYears,
    locations: {
      prospectpark: location,
    },
  });

  return fullStats;
}
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

  if (athleteDoc.stats_version === 'v2') {
    if (verbose) {
      console.log(`-----------------
Already migrated: ${getAthleteIdentifier(athleteDoc)}`);
    }
    return {
      status: 'Already V2',
      athleteId,
    };
  }

  const legacyStatsTest = getLegacyStatsTest(_cloneDeep(athleteDoc.stats));

  const v2Stats = await transformStats(
    _cloneDeep(athleteDoc.stats),
    athleteId,
  );

  const v2StatsClone = _cloneDeep(v2Stats);
  _unset(v2StatsClone, 'locations.prospectpark.byMonth');
  _unset(v2StatsClone, 'locations.prospectpark.numActivities');

  const statsMatch = _isEqual(v2StatsClone, legacyStatsTest);

  if (!statsMatch) {
    if (verbose) {
      console.log('V2 Stats:');
      console.log(JSON.stringify(v2StatsClone, null, 2));
      console.log('Legacy stats:');
      console.log(JSON.stringify(legacyStatsTest, null, 2));
    }
    return {
      status: 'Stats error',
      athleteId,
    };
  }

  if (verbose) {
    console.log(`-----------------
Migration successful: ${getAthleteIdentifier(athleteDoc)}
All-time PP laps: ${v2Stats.locations.prospectpark.allTime}
Number PP Activitie: ${v2Stats.locations.prospectpark.numActivities}`);
  }


  athleteDoc.set({
    stats_version: 'v2',
    stats: v2Stats,
    last_updated: new Date().toISOString(),
  });
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
