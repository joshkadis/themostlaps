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
const INGEST_QUEUE_INTERVAL = 30 * 60 * 1000; // 30mins
const PROCESS_QUEUE_AS_DRY_RUN = process.env.PROCESS_QUEUE_AS_DRY_RUN || false;

/**
 * Process the ingestion queue
 *
 * @param {Bool} isDryRun Default to false
 */
async function processQueue(isDryRun) {
  if (isDryRun) {
    console.log('This is a dry run of processQueue()');
  }

  const queueActivities = await QueueActivity.find({
    status: 'pending',
  });

  if (!queueActivities || !queueActivities.length) {
    console.warn('No pending QueueActivity documents');
    return;
  }

  // eslint-disable-next-line no-restricted-syntax
  for await (const queueActivityDoc of queueActivities) {
    try {
      if (queueActivityDoc.ingestAttempts === MAX_INGEST_ATTEMPTS) {
        console.log(`Reached MAX_INGEST_ATTEMPTS for QueueActivity ${queueActivityDoc.activityId}`);
        await dequeueActivity(queueActivityDoc.activityId, 'Reached MAX_INGEST_ATTEMPTS');
        break;
      }

      const processingResult = await getQueueActivityData(queueActivityDoc);
      const { processedQueueDoc } = processingResult;

      // Ingest QueueActivity to Activity
      if (!isDryRun) {
        const forUpdate = await handleQueueActivityData(processingResult);
        // @todo Test setting doc.detail when doc.errorMsg already exists
        processedQueueDoc.set(forUpdate);
        await processedQueueDoc.save();
      }

      console.log(`processedQueueActivity() status for ${processedQueueDoc.activityId}: ${processedQueueDoc.status}`);
    } catch (err) {
      // @todo Make sure error is sent to Sentry
      await queueActivityDoc.updateOne({
        status: 'error',
        errorMsg: `getQueueActivityData() failed for activity ${queueActivityDoc.id}`,
      });
    }
  }
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
    console.log('Beginning activity queue processing run');
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
  getQueueActivityData,
};
