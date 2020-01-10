/**
 * `$ activity queue ...` commands. I don't think we can use
 * `.commandDir()` because our CLI needs to be backwards-compatible
 */

const QueueActivity = require('../../schema/QueueActivity');
const {
  enqueueActivity,
  dequeueActivity,
  deleteActivity,
  updateActivityStatus,
} = require('../../utils/v2/activityQueue/utils');
const {
  processQueue,
  processQueueActivity,
  cancelActivityQueue,
} = require('../../utils/v2/activityQueue');
const { setupConnection } = require('../utils/setupConnection');

/**
 * Get message from CLI args
 *
 * @param {String|Bool} args.m
 * @param {String|Bool} args.message
 * @return {String|Bool} Message string, or empty string, or false
 */
function getMessageValue({ m, message }) {
  if (m === false && message === false) {
    return false;
  }
  if (m === false) {
    return message.toString();
  }
  if (message === false) {
    return m.toString();
  }
  return false;
}

/**
 * Check for expected number of args
 * Note that args[0] will be name of subcommand
 * args[1]... will be the actual arguments
 *
 * @param {Array} args
 * @param {Integer} num Expected number of args
 * @param {String} warning Text for warning if wrong number of args
 * @return {Bool}
 */
function checkNumArgs(args, num, warning) {
  if (args.length !== num) {
    console.warn(`Use format: $ activity queue ${warning}`);
    return false;
  }
  return true;
}

/**
 * Display info for a queued activity
 *
 * @param {Integer} args.subargs[1] Activity ID
 */
async function doGet({ subargs }) {
  if (!checkNumArgs(subargs, 2, 'get <activityId>')) {
    return;
  }

  const doc = await QueueActivity.findOne({ activityId: subargs[1] });
  if (doc) {
    console.log(doc.toJSON());
  } else {
    console.warn(`Could not find activity ${subargs[1]} in queue`);
  }
}

/**
 * Adds an activity to queue with 'pending' status
 *
 * @param {Integer} args.subargs[1] Activity ID
 * @param {Integer} args.subargs[2] Athlete ID
 * @param {Integer} args.time Option timestamp in MS to set as createdAt
 */
async function doEnqueue({
  subargs = [],
  t = false,
  time = false,
  m = false,
  message = false,
}) {
  if (!checkNumArgs(subargs, 3, 'enqueue <activityId> <athleteId> [--time=<time>] [--message=<message>]')) {
    return;
  }

  const enqueueArgs = {
    object_id: subargs[1],
    owner_id: subargs[2],
  };

  if (time || t) {
    enqueueArgs.event_time = time || t;
  }

  const messageVal = getMessageValue({ m, message });
  const success = await enqueueActivity(enqueueArgs, messageVal);

  if (!success) {
    console.warn('Failed to enqueue activity, see error logs');
  } else {
    console.log(`Enqueued activity ${subargs[1]} for athlete ${subargs[2]}`);
    if (messageVal !== false) {
      console.log(`Message: "${messageVal}"`);
    }
  }
}

/**
 * Set QueueActivity's status to 'dequeued'
 *
 * @param {Integer} args.subargs[1] Activity ID
 */
async function doDequeue({
  subargs,
  m = false,
  message = false,
}) {
  if (!checkNumArgs(subargs, 2, 'dequeue <activityId> [--message=<message>]')) {
    return;
  }

  const messageVal = getMessageValue({ m, message });
  const success = await dequeueActivity(subargs[1], messageVal);

  if (!success) {
    console.warn(`Failed to dequeue QueueActivity ${subargs[1]}, see error logs`);
  } else {
    console.log(`Success: dequeued QueueActivity ${subargs[1]}`);
    if (messageVal !== false) {
      console.log(`Message: "${messageVal}"`);
    }
  }
}

/**
 * Delete activity from ingestion queue
 *
 * @param {Integer} args.subargs[1] Activity ID
 */
async function doDelete({ subargs }) {
  if (!checkNumArgs(subargs, 2, 'delete <activityId>')) {
    return;
  }

  const success = await deleteActivity(subargs[1]);

  if (!success) {
    console.warn(`Failed to delete QueueActivity ${subargs[1]}, see error logs`);
  } else {
    console.log(`Success: delete QueueActivity ${subargs[1]}`);
  }
}

/**
 * Change status of activity ingestion queue.
 * See schema/QueueActivity fo valid statuses
 *
 * @param {Integer} args.subargs[1] Activity ID
 * @param {String} args.status New status
 */
async function doUpdate({
  subargs = [],
  s = false,
  status = false,
  m = false,
  message = false,
}) {
  if (!checkNumArgs(subargs, 2, 'update <activityId> [--status=<status>] [--message=<message>]')) {
    return;
  }

  const newStatus = s || status;
  const messageVal = getMessageValue({ m, message });
  if (!newStatus && messageVal === false) {
    console.warn('Requires --status or --message');
    return;
  }

  const success = await updateActivityStatus(subargs[1], newStatus, messageVal);

  if (!success) {
    console.warn(`Failed to update QueueActivity ${subargs[1]}`);
  } else {
    console.log(`Success: Updated QueueActivity ${subargs[1]}`);
    if (newStatus) {
      console.log(`Status: "${newStatus}"`);
    }
    if (messageVal !== false) {
      console.log(`Message: "${messageVal}"`);
    }
  }
}

/**
 * Ingest an enqueued activity to the activities collection
 *
 * @param {Integer} args.subargs[1] Activity ID
 * @param {String} args.dryRun If true, will process without DB updates
 */
async function doIngestActivity({
  subargs,
  dryRun: isDryRun = false,
}) {
  if (!checkNumArgs(subargs, 2, 'ingest <activityId> <[--dry-run]>')) {
    return;
  }

  const activityId = subargs[1];

  // Get doc from queue and check eligibility
  const findQuery = { activityId };
  const queueDoc = await QueueActivity.findOne(findQuery);
  if (!queueDoc) {
    console.warn(`QueueActivity ${activityId} was not found in the QueueActivity collection.`);
    return;
  }

  await processQueueActivity(queueDoc, findQuery, isDryRun);
  console.log(queueDoc.toJSON());
  if (isDryRun) {
    console.log('**This was a dry run; no DB write operations.**');
  }
}

/**
 * Process the entire ingestion queue
 *
 * @param {String} args.status Status to query for when ingesting
 * @param {String} args.dryRun If true, will process without DB updates
 */
async function doProcessQueue({
  s = false,
  status = false,
  dryRun: isDryRun = false,
}) {
  const queryStatus = status || s || 'pending';
  await processQueue(
    { status: queryStatus },
    isDryRun,
  );
  if (isDryRun) {
    console.log('**This was a dry run; no DB write operations.**');
  }
}

/**
 * Reset activity to original pending state
 */
async function doReset({ subargs }) {
  const doc = await QueueActivity.findOne({ activityId: subargs[1] });
  if (!doc) {
    console.log(`Could not find QueueActivity ${subargs[1]}`);
  }
  const deleted = await deleteActivity(subargs[1]);
  if (!deleted) {
    console.warn(`Failed to delete QueueActivity ${subargs[1]}, see error logs`);
    return;
  }


  const enqueued = await enqueueActivity(
    {
      object_id: doc.activityId,
      owner_id: doc.athleteId,
    },
    '', // clear errMsg/detail field
  );
  if (!enqueued) {
    console.warn(`Failed to reset QueueActivity ${doc.activityId}, see error logs`);
  } else {
    console.log(`Reset QueueActivity ${doc.activityId} for athlete ${doc.athleteId}`);
  }
}

/**
 * Handle a CLI command like `$ article queue...`
 *
 * @param {Object} args From yargs
 */
async function doCommand(args) {
  if (args.subcommand !== 'queue') {
    console.warn("You didn't call `$ activity queue ...`");
    return;
  }

  switch (args.subargs[0]) {
    case 'get':
      await doGet(args);
      break;

    case 'enqueue':
      await doEnqueue(args);
      break;

    case 'dequeue':
      await doDequeue(args);
      break;

    case 'reset':
      await doReset(args);
      break;

    case 'delete':
      await doDelete(args);
      break;

    case 'update':
      await doUpdate(args);
      break;

    case 'ingestactivity':
      await doIngestActivity(args);
      break;

    case 'processqueue':
      await doProcessQueue(args);
      break;

    case 'cancel':
      cancelActivityQueue();
      break;

    default:
      console.error(`${args.subargs[0]} is not a valid subcommand of $ activity queue`);
  }
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
