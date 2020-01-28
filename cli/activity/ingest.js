/* eslint-disable no-underscore-dangle */
const { setupConnection } = require('../utils/setupConnection');

/**
 * Handle a CLI command `$ article ingest ...`
 *
 * @param {Object} args From yargs
 */
async function doCommand() {

}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
