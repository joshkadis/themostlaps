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
} = require('./getQueueActivityData');
const { ingestActivityFromStravaData } = require('./ingestActivityFromStravaData');

const MAX_INGEST_ATTEMPTS = 8;
const INGEST_QUEUE_INTERVAL = 60 * 60 * 1000; // 1hr
const PROCESS_QUEUE_AS_DRY_RUN = process.env.PROCESS_QUEUE_AS_DRY_RUN || false;

/**
 * Process a single QueueActivity
 *
 * @param {QueueActivity} queueActivityDoc
 * @param {Object|null} query Object from find query
 * @param {Bool} isDryRun
 */
async function processQueueActivity(
  queueActivityDoc,
  query = {},
  isDryRun = false,
) {
  const completeProcessing = async () => {
    if (!isDryRun) {
      await queueActivityDoc.save();
    }
    console.log(`Completed ${queueActivityDoc.activityId}: ${queueActivityDoc.status}`);
  };

  const {
    activityId,
    athleteId,
    ingestAttempts,
    status: activityStatus,
  } = queueActivityDoc;
  console.log(`${"\n"}Processing QueueActivity ${activityId} | Athlete ${athleteId}`);
  try {
    // Skip if query specified a status other than the document's status
    // @todo handle { status: { $in: [...] } } queries, etc.
    if (query.status && query.status !== activityStatus) {
      console.log(`Attempted ${activityId} | Status ${activityStatus} | Queried ${query.staus}`);
      return false;
    }

    if (ingestAttempts === MAX_INGEST_ATTEMPTS) {
      const detail = `Reached max. ingest attempts: ${ingestAttempts}`;
      console.log(detail);
      queueActivityDoc.set({
        status: 'maxed',
        detail,
      });
      return completeProcessing();
    }

    const exists = await Activity.exists({ _id: activityId });
    if (exists) {
      console.log('already exists as Activity document');
      queueActivityDoc.set({
        status: 'dequeued',
        detail: 'already exists as Activity document',
      });
      return completeProcessing();
    }

    const athleteDoc = await Athlete.findById(athleteId);
    if (!athleteDoc) {
      const errorMsg = `Athlete ${athleteId} not found`;
      console.warn(errorMsg);
      queueActivityDoc.set({
        status: 'error',
        errorMsg: 'No athleteDoc',
      });
      return completeProcessing();
    }

    // Get Strava API data and set status of queueActivityDoc
    const apiData = await getQueueActivityData(
      queueActivityDoc,
      athleteDoc,
    );
    if (!apiData && !isDryRun) {
      return completeProcessing();
    }

    if (queueActivityDoc.status === 'shouldIngest') {
      // Ingest QueueActivity to Activity
      const forUpdate = await ingestActivityFromStravaData(
        apiData,
        athleteDoc,
        isDryRun,
      );
      queueActivityDoc.set(forUpdate);
    }

    return completeProcessing();
  } catch (err) {
    // @todo Make sure error is sent to Sentry
    queueActivityDoc.set({
      status: 'error',
      errorMsg: err.message,
    });
    return completeProcessing();
  }
}


/**
 * Process the ingestion queue
 *
 * @param {Object} query Object for find query
 * @param {Bool} opts.isDryRun Default to false
 */
async function processQueue(query, opts = {}) {
  const { isDryRun = false } = opts;
  console.log(`Finding QueueActivity documents for query:${"\n"}${JSON.stringify(query, null, 2)}`);
  const queueActivities = await QueueActivity.find(query);
  if (!queueActivities || !queueActivities.length) {
    console.warn('No QueueActivity documents were found.');
    return;
  }

  console.log(`Starting processQueue() with ${queueActivities.length} QueueActivity documents`);

  if (isDryRun) {
    console.log('This is a dry run!');
  }

  const log = {};
  // eslint-disable-next-line no-restricted-syntax
  for await (const queueActivityDoc of queueActivities) {
    await processQueueActivity(queueActivityDoc, query, isDryRun);
    const { status } = queueActivityDoc;
    log[status] = log[status]
      ? log[status] + 1
      : 1;
  }
  console.log(`${"\n"}End of processQueue() for ${queueActivities.length} activities`);
  console.table(log);
}

/**
 * Handle incoming webhook to enqueue or dequeue activity
 *
 * @param {Object} webhookData Ssee https://developers.strava.com/docs/webhooks/
 */
async function handleActivityWebhook(webhookData) {
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
    // Check if already in the queue
    const updated = await QueueActivity.findOneAndUpdate(
      { activityId: object_id },
      { status: 'error', errorMsg: 'Received duplicate create webhook' },
    );
    if (updated) {
      console.log('Received duplicate create webhook');
      return;
    }
    // Enqueue if not already in queue
    enqueueActivity(webhookData);
  } else if (aspect_type === 'delete') {
    // @todo Use deleteActivity() after testing is complete
    dequeueActivity(object_id, 'deletion webhook');
  }
}

/**
 * Fire up the standard ingestion queue for pending activities
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
    processQueue(
      { status: 'pending' },
      PROCESS_QUEUE_AS_DRY_RUN,
    );
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
