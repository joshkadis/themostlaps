/**
 * `$ activity queue ...` commands. I don't think we can use
 * `.commandDir()` because our CLI needs to be backwards-compatible
 */

const QueueActivity = require('../../schema/QueueActivity');
const Activity = require('../../schema/Activity');
const {
  enqueueActivity,
  dequeueActivity,
  deleteActivity,
  updateActivityStatus,
} = require('../../utils/v2/activityQueue/utils');
const { processQueueActivity } = require('../../utils/v2/activityQueue');
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
}) {
  if (!checkNumArgs(subargs, 3, 'enqueue <activityId> <athleteId> [--time]')) {
    return;
  }

  const enqueueArgs = {
    object_id: subargs[1],
    owner_id: subargs[2],
  };

  if (time || t) {
    enqueueArgs.event_time = time || t;
  }

  const success = await enqueueActivity(enqueueArgs);
  if (!success) {
    console.warn('Failed to enqueue activity, see error logs');
  } else {
    console.log(`Enqueued activity ${subargs[1]} for athlete ${subargs[2]}`);
  }
}

/**
 * Set queue activity's status to 'dequeued'
 *
 * @param {Integer} args.subargs[1] Activity ID
 */
async function doDequeue({ subargs }) {
  if (!checkNumArgs(subargs, 2, 'dequeue <activityId>')) {
    return;
  }

  const success = await dequeueActivity(subargs[1]);

  if (!success) {
    console.warn(`Failed to dequeue queue activity ${subargs[1]}, see error logs`);
  } else {
    console.log(`Success: dequeued queue activity ${subargs[1]}`);
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
    console.warn(`Failed to delete queue activity ${subargs[1]}, see error logs`);
  } else {
    console.log(`Success: delete queue activity ${subargs[1]}`);
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
}) {
  if (!checkNumArgs(subargs, 2, 'update <activityId> <[--status]>')) {
    return;
  }

  const newStatus = s || status;
  if (!newStatus) {
    console.warn('Requires argument -s or --status');
    return;
  }

  const success = await updateActivityStatus(subargs[1], newStatus);
  if (!success) {
    console.warn(`Failed to update queue activity ${subargs[1]} status to ${newStatus}, see error logs`);
  } else {
    console.log(`Success: Updated queue activity ${subargs[1]} status to ${newStatus}`);
  }
}

/**
 * Ingest an enqueued activity to the activities collection
 *
 * @param {Integer} args.subargs[1] Activity ID
 * @param {String} args.dryRun If true, will process without DB updates
 */
async function doIngestOne({
  subargs,
  dryRun: isDryRun = false,
}) {
  if (!checkNumArgs(subargs, 2, 'ingest <activityId> <[--dry-run]>')) {
    return;
  }

  const activityId = subargs[1];

  // Check that activity doesn't exist in activities collection
  const exists = await Activity.exists({ _id: activityId });
  if (exists) {
    console.warn(`Queue activity ${activityId} has already been ingested.`);
    return;
  }

  // Get doc from queue
  let queueDoc = await QueueActivity.findOne({ activityId });
  if (!queueDoc) {
    console.warn(`Queue activity ${activityId} was not found.`);
    return;
  }

  // Check doc from queue
  if (queueDoc.status !== 'pending') {
    console.warn(`Queue activity ${activityId} has status ${queueDoc.status}. Must be 'pending'`);
    return;
  }

  queueDoc = await processQueueActivity(queueDoc, true); // @todo isDryRun
  if (!queueDoc || !queueDoc.status || !queueDoc.status === 'error') {
    console.warn(`Failed to ingest queue activity ${activityId}`);
  } else {
    console.log(`Queue activity ${activityId} status after ingest command: ${queueDoc.status})`);
  }
  console.log(queueDoc.toJSON());

  // Handle status as in processQueue() depending on isDryRun
}

/**
 * Handle a CLI command like `$ article queue...`
 *
 * @param {Object} args From yargs
 */
async function doCommand(args) {
  if (!args.queue) {
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

    case 'delete':
      await doDelete(args);
      break;

    case 'update':
      await doUpdate(args);
      break;

    case 'ingest':
      await doIngestOne(args);
      break;

    default:
      console.error('You must provide a valid subcommand.');
  }
}

module.exports = {
  doCommand,
  doEnqueue,
  doDequeue,
  doDelete,
  doGet,
  doIngestOne,
  doUpdate,
};
