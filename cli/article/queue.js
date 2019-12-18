/**
 * `$ article queue ...` commands. We can't use `.commandDir()` because it needs
 * to be backwards-compatible
 */

const QueueActivity = require('../../schema/QueueActivity');
const Activity = require('../../schema/Activity');
const {
  enqueueActivity,
  dequeueActivity,
  deleteActivity,
  updateActivityStatus,
  processQueueActivity,
} = require('../../utils/v2/activityQueue');

async function enqueue({
  subargs = [],
  t = false,
  time = false,
}) {
  if (subargs.length !== 3) {
    console.warn('Use format: $ article queue enqueue <activityId> <athleteId> [--time]');
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

async function dequeueOrDelete({ subargs }, shouldDequeue = true) {
  if (subargs.length !== 2) {
    console.warn(`Use format: $ article queue ${subargs[0]} <activityId>`);
    return;
  }
  const success = shouldDequeue
    ? await dequeueActivity(subargs[1])
    : await deleteActivity(subargs[1]);

  if (!success) {
    console.warn(`Failed to ${subargs[0]} activity ${subargs[1]}, see error logs`);
  } else {
    console.log(`Success: ${subargs[0]}d activity ${subargs[1]}`);
  }
}

async function update({
  subargs = [],
  s = false,
  status = false,
}) {
  if (subargs.length !== 2) {
    console.warn('Use format: $ article queue update <activityId> <[--status]>');
    return;
  }
  const newStatus = s || status;
  if (!newStatus) {
    console.warn('Requires argument -s or --status');
    return;
  }

  const success = await updateActivityStatus(subargs[1], newStatus);
  if (!success) {
    console.warn(`Failed to update activity ${subargs[1]} status to ${newStatus}, see error logs`);
  } else {
    console.log(`Success: updated activity ${subargs[1]} status to ${newStatus}`);
  }
}

async function ingestOne({
  subargs,
  dryRun: isDryRun = false,
}) {
  if (subargs.length !== 2) {
    console.warn('Use format: $ article queue ingest <activityId> <[--dry-run]>');
    return;
  }
  const activityId = subargs[1];

  // Check that activity doesn't exist in activities collection
  const exists = await Activity.exists({ _id: activityId });
  if (exists) {
    console.warn(`Activity ${activityId} has already been ingested.`);
    return;
  }

  // Get doc from queue
  let queueDoc = await QueueActivity.findOne({ activityId });
  if (!queueDoc) {
    console.warn(`Activity ${activityId} is not in the ingestion queue.`);
    return;
  }

  // Check doc from queue
  if (queueDoc.status !== 'pending') {
    console.warn(`Activity ${activityId} has status ${queueDoc.status}. Must be 'pending'`);
    return;
  }

  queueDoc = await processQueueActivity(queueDoc, true); // @todo isDryRun
  if (!queueDoc || !queueDoc.status || !queueDoc.status === 'error') {
    console.warn(`Failed to ingest activity ${activityId}`);
  } else {
    console.log(`activity ${activityId} status after ingest: ${queueDoc.status})`);
  }
  console.log(queueDoc.toJSON());

  // Handle status as in processQueue() depending on isDryRun
}

async function doCommand(args) {
  if (!args.queue) {
    console.warn("You didn't call `$ article queue ...`");
    return;
  }

  switch (args.subargs[0]) {
    case 'enqueue':
      await enqueue(args);
      break;

    case 'dequeue':
      await dequeueOrDelete(args, true);
      break;

    case 'delete':
      await dequeueOrDelete(args, false);
      break;

    case 'update':
      await update(args);
      break;

    case 'ingest':
      await ingestOne(args)
      break;

    default:
      console.log('You must provide a valid subcommand.');
  }
}

module.exports = {
  doCommand,
  enqueue,
  dequeueOrDelete,
  update,
};
