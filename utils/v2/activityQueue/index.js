/* eslint-disable quotes */
const Activity = require('../../../schema/Activity');
const Athlete = require('../../../schema/Athlete');
const QueueActivity = require('../../../schema/QueueActivity');
const {
  enqueueActivity,
  dequeueActivity,
} = require('./utils');
const {
  getQueueActivityData,
  handleQueueActivityData,
} = require('./processing');

const MAX_INGEST_ATTEMPTS = 8;
const INGEST_QUEUE_INTERVAL = 60 * 60 * 1000; // 1hr
const PROCESS_QUEUE_AS_DRY_RUN = process.env.PROCESS_QUEUE_AS_DRY_RUN || false;

/**
 * Process a single QueueActivity
 *
 * @param {QueueActivity} queueActivityDoc
 * @param {Bool} isDryRun
 */
async function processQueueActivity(queueActivityDoc, isDryRun = false) {
  const {
    activityId,
    athleteId,
    ingestAttempts,
  } = queueActivityDoc;
  console.log(`Processing QueueActivity ${activityId} | Athlete ${athleteId} ${"\n"}`);
  try {
    if (ingestAttempts === MAX_INGEST_ATTEMPTS) {
      const detail = `Reached max. ingest attempts: ${ingestAttempts}`;
      console.log(detail);
      queueActivityDoc.set({
        status: 'dequeued',
        detail,
      });
      if (!isDryRun) {
        await queueActivityDoc.save();
      }
      return;
    }

    const exists = await Activity.exists({ _id: activityId });
    if (exists) {
      console.log('already exists as Activity document');
      queueActivityDoc.set({
        status: 'dequeued',
        detail: 'already exists as Activity document',
      });
      if (!isDryRun) {
        await queueActivityDoc.save();
      }
      return;
    }

    const athleteDoc = await Athlete.findById(athleteId);
    if (!athleteDoc) {
      const errorMsg = `Athlete ${athleteId} not found`;
      console.warn(errorMsg);
      queueActivityDoc.set({
        status: 'error',
        errorMsg: 'No athleteDoc',
      });
      if (!isDryRun) {
        await queueActivityDoc.save();
      }
      return;
    }

    // Get Strava API data and set status of queueActivityDoc
    const apiData = await getQueueActivityData(
      queueActivityDoc,
      athleteDoc,
    );
    if (!apiData && !isDryRun) {
      // error status and message set during getQueueActivityData()
      await queueActivityDoc.save();
      return;
    }

    // @todo Can we be more specific about statuses that can be used here?
    // Should it only allow shouldIngest?
    if (processedQueueDoc.status !== 'error') {
      // Ingest QueueActivity to Activity
      const forUpdate = await handleQueueActivityData(
        processingResult,
        isDryRun,
      );
      processedQueueDoc.set(forUpdate);
    }

    if (!isDryRun) {
      await processedQueueDoc.save();
    }

    console.log(`Status for ${processedQueueDoc.activityId}: ${processedQueueDoc.status}`);
  } catch (err) {
    // @todo Make sure error is sent to Sentry
    await queueActivityDoc.updateOne({
      status: 'error',
      errorMsg: err.message,
    });
  }
}


/**
 * Process the ingestion queue
 *
 * @param {Bool} isDryRun Default to false
 */
async function processQueue(isDryRun) {
  const queueActivities = await QueueActivity.find({
    status: 'pending',
  });

  if (!queueActivities || !queueActivities.length) {
    console.warn('No QueueActivity documents with "pending" status');
    return;
  }

  console.log(`Starting processQueue() with ${queueActivities.length} QueueActivity documents`);

  if (isDryRun) {
    console.log('This is a dry run!');
  }

  // eslint-disable-next-line no-restricted-syntax
  for await (const queueActivityDoc of queueActivities) {
    await processQueueActivity(queueActivityDoc, isDryRun);
  }
  console.log(`End of processQueue()
----------------------
`);
}

/**
 * Handle incoming webhook to enqueue or dequeue activity
 *
 * @param {Object} webhookData Ssee https://developers.strava.com/docs/webhooks/
 */
function handleActivityWebhook(webhookData) {
  const {
    object_type,
    aspect_type,
    object_id,
  } = webhookData;

  // Sanity check
  if (object_type !== 'activity') {
    return;
  }

  // @todo Reset QueueActivity if already enqueued as pending
  // ignore if other status
  if (aspect_type === 'create') {
    enqueueActivity(webhookData);
  } else if (aspect_type === 'delete') {
    // @todo Use deleteActivity() after testing is complete
    dequeueActivity(object_id, 'deletion webhook');
  }
}

/**
 * Fire up the ingestion queue
 */
function initializeActivityQueue() {
  if (!process.env.INITIALIZE_ACTIVITY_QUEUE) {
    console.log('Requires env var to intialize activity ingest queue');
    return;
  }

  console.log('Initializing activity ingest queue');
  const interval = setInterval(() => {
    if (!process.env.INITIALIZE_ACTIVITY_QUEUE) {
      console.log('Canceling scheduled activity queue ingestion');
      clearInterval(interval);
    }
    processQueue(PROCESS_QUEUE_AS_DRY_RUN);
  }, INGEST_QUEUE_INTERVAL);
}

/**
 * Cancel running activity queue
 */
function cancelActivityQueue() {
  console.log(`Canceling a running activity queue is coming soon.
In the meantime, clear process.env.INITIALIZE_ACTIVITY_QUEUE and restart the Node process.`);
}

module.exports = {
  cancelActivityQueue,
  handleActivityWebhook,
  initializeActivityQueue,
  processQueue,
  processQueueActivity,
};
