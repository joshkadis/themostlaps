const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete ingestv2');

/**
 * Redo activities ingestion for a given athlete
 */
async function doCommand({
  subargs,
  dryRun: isDryRun = false,
}) {
  if (!checkNumArgs(subargs, 1, '<athleteId>')) {
    return;
  }
  // Do stuff
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
