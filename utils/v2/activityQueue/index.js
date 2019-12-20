const QueueActivity = require('../../../schema/QueueActivity');
const Athlete = require('../../../schema/Athlete');
const { fetchActivity } = require('../../refreshAthlete/utils');
const {
  enqueueActivity,
  dequeueActivity,
} = require('./utils');
const { ingestActivityFromQueue } = require('./ingestActivityFromQueue');

const MAX_INGEST_ATTEMPTS = 8;
const INGEST_QUEUE_INTERVAL = 30 * 60 * 1000; // 30mins
const PROCESS_QUEUE_AS_DRY_RUN = process.env.PROCESS_QUEUE_AS_DRY_RUN || false;

/**
 * Process an activity in the queue and return updated document
 *
 * @param {QueueActivity} queueDoc QueueActivity document
 * @return {QueueActivity} queueDoc with updated properties
 */
async function processQueueActivity(queueDoc) {
  const {
    activityId,
    athleteId,
    status,
    numSegmentEfforts: prevNumSegmentEfforts = 0,
    ingestAttempts: prevIngestAttempts = 0,
  } = queueDoc;

  if (status !== 'pending') {
    console.warn(`Attempted to ingest queue activity ${activityId} with status ${status}`);
    queueDoc.set({
      status: 'error',
      errorMsg: `Attempted ingest with status '${status}'`,
    });
    return {
      processedQueueDoc: queueDoc,
      dataForIngest: false,
      athleteDoc: false,
    };
  }

  const athleteDoc = await Athlete.findById(athleteId);
  if (!athleteDoc) {
    console.warn(`Could not find athlete ${athleteId} to ingest queue activity ${activityId}`);
    queueDoc.set({
      status: 'error',
      errorMsg: 'No athleteDoc',
    });
    return {
      processedQueueDoc: queueDoc,
      dataForIngest: false,
      athleteDoc: false,
    };
  }

  let dataForIngest = false;
  try {
    dataForIngest = await fetchActivity(activityId, athleteDoc);
  } catch (err) {
    // i think we're ok here without doing anything
  }

  if (!dataForIngest) {
    console.warn(`No fetchActivity response for activity ${activityId}`);
    queueDoc.set({
      status: 'error',
      errorMsg: 'No fetchActivity response',
    });
    return {
      processedQueueDoc: queueDoc,
      dataForIngest: false,
      athleteDoc: false,
    };
  }

  const nextNumSegmentEfforts = dataForIngest.segment_efforts
    ? dataForIngest.segment_efforts.length
    : 0;

  // Look for same number of segment efforts twice in a row
  // Use this as proxy for Strava processing having completed
  if (
    nextNumSegmentEfforts > 0
    && nextNumSegmentEfforts === prevNumSegmentEfforts
  ) {
    queueDoc.set({ status: 'shouldIngest' });
  }

  queueDoc.set({
    numSegmentEfforts: nextNumSegmentEfforts,
    lastAttemptedAt: Date.now(),
    ingestAttempts: prevIngestAttempts + 1,
  });
  return {
    processedQueueDoc: queueDoc,
    dataForIngest,
    athleteDoc,
  };
}

/**
 * Ingest if needed, get result of processQueueActivity
 *
 * @param {QueueActivity} result.processedQueueDoc
 * @param {Object} result.dataForIngest
 * @param {Athlete} result.athleteDoc
 * @return {Object} Properties to update document
 */
async function handleProcessingResult({
  processedQueueDoc,
  dataForIngest,
  athleteDoc,
}) {
  if (!dataForIngest) {
    return { status: 'error', errorMsg: 'No dataForIngest' };
  }

  const isAthleteInstance = athleteDoc instanceof Athlete;
  if (!isAthleteInstance) {
    return { status: 'error', errorMsg: 'Invalid Athlete document' };
  }

  if (processedQueueDoc.status === 'shouldIngest') {
    const ingestResult = await ingestActivityFromQueue(
      dataForIngest,
      athleteDoc,
    );
    return ingestResult
      ? { status: 'ingested', errorMsg: '' }
      : { status: 'error', errorMsg: 'ingestActivityFromQueue() failed' };
  }

  if (processedQueueDoc.status === 'pending') {
    return { errorMsg: '' };
  }

  return {};
}

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
        await dequeueActivity(queueActivityDoc.id);
        break;
      }

      const processingResult = await processQueueActivity(queueActivityDoc);
      const { processedQueueDoc } = processingResult;

      // Ingest QueueActivity to Activity
      if (!isDryRun) {
        const forUpdate = await handleProcessingResult(processingResult);
        processedQueueDoc.set(forUpdate);
        await processedQueueDoc.save();
      }

      console.log(`processedQueueActivity() status for ${processedQueueDoc.activityId}: ${processedQueueDoc.status}`);
    } catch (err) {
      // @todo Make sure error is sent to Sentry
      await queueActivityDoc.updateOne({
        status: 'error',
        errorMsg: `processQueueActivity() failed for activity ${queueActivityDoc.id}`,
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
    dequeueActivity(object_id);
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
  processQueueActivity,
};
