const { confirm } = require('promptly');
const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const Athlete = require('../../schema/Athlete');
const { ingestAthleteHistory } = require('../../utils/v2/ingestAthlete/ingestAthleteHistory');
const { getLocationNames } = require('../../utils/v2/locations');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete ingestv2');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';
/**
 * Redo activities ingestion for a given athlete
 */
async function doCommand({
  subargs,
  dryRun: isDryRun = false,
  location = '',
}) {
  if (!checkNumArgs(subargs, 1, '<athleteId>')) {
    return;
  }
  const athleteId = Math.floor(Number(subargs[0]));
  if (Number.isNaN(athleteId) || athleteId < 0) {
    console.warn(`Invalid athlete ID: ${subargs[0]}`);
    return;
  }

  const athleteDoc = await Athlete.findById(athleteId);
  if (!athleteDoc) {
    console.warn(`Athlete ${athleteId} not found`);
    return;
  }

  if (location && getLocationNames().indexOf(location) === -1) {
    console.warn(`Unknown location: ${location}`);
    return;
  }
  if (location && !isDryRun) {
    const confirmed = await confirm('Ingesting a single location will overwrite stats from other locations. Continue? [y/n]');
    if (!confirmed) {
      return;
    }
  }
  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  /**
   * BUG where ingesting one location will overwrite
   * existing status for any other locations
   */
  await ingestAthleteHistory(
    athleteDoc,
    location ? [location] : null,
    isDryRun,
  );

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
