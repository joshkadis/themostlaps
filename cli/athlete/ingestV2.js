const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const Athlete = require('../../schema/Athlete');
const ingestAthleteHistory = require('../../utils/v2/ingestAthlete/ingestAthleteHistory');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete ingestv2');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';
/**
 * Redo activities ingestion for a given athlete
 */
async function doCommand({
  subargs,
  dryRun: isDryRun = false, // Currently forcing true in index.js
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

  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  await ingestAthleteHistory(athleteDoc, isDryRun);

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
