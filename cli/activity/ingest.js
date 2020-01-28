/* eslint-disable no-underscore-dangle */
const QueueActivity = require('../../schema/QueueActivity');
const Activity = require('../../schema/Activity');
const { setupConnection } = require('../utils/setupConnection');
const { processQueueActivity } = require('../../utils/v2/activityQueue');
const { makeCheckNumArgs } = require('../utils');

const checkNumArgs = makeCheckNumArgs('Use format: $ activity ingest');

/**
 * Handle a CLI command `$ article ingest ...`
 *
 * @param {Object} args From yargs
 */
async function doCommand({ subargs, dryRun: isDryRun }) {
  if (!checkNumArgs(subargs, 1, '<activityId>')) {
    return;
  }

  const activityId = Number(subargs[0]);

  const queueActivityDoc = await QueueActivity.findOne({
    activityId,
  });

  if (!queueActivityDoc) {
    console.log(`QueueActivity ${activityId} not found`);
    return;
  }

  if (!isDryRun) {
    Activity.removeOne({ _id: activityId });
  }

  queueActivityDoc.set({
    status: 'shouldIngest',
  });

  await processQueueActivity(
    queueActivityDoc,
    {},
    isDryRun,
  );
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
