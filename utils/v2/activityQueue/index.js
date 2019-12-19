const QueueActivity = require('../../../schema/QueueActivity');
const Athlete = require('../../../schema/Athlete');
const { fetchActivity } = require('../../refreshAthlete/utils');
const {
  dequeueActivity,
} = require('./utils');
const { ingestActivityFromQueue } = require('./ingestActivityFromQueue');

const MAX_INGEST_ATTEMPTS = 8;

/**
 * Process an activity in the queue and return updated document
 *
 * @param {QueueActivity} queueDoc QueueActivity document
 * @param {Bool} isDryRun Default to false
 * @return {QueueActivity} queueDoc with updated properties
 */
async function processQueueActivity(queueDoc, isDryRun = false) {
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
    (nextNumSegmentEfforts > 0
    && nextNumSegmentEfforts === prevNumSegmentEfforts)
    || isDryRun
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
 * Process the ingestion queue
 *
 * @param {Bool} isDryRun Default to false
 */
async function processQueue(isDryRun) {
  const activities = await QueueActivity.find({
    status: 'pending',
  });

  // eslint-disable-next-line no-restricted-syntax
  for await (const activityDoc of activities) {
    try {
      if (activityDoc.ingestAttempts === MAX_INGEST_ATTEMPTS) {
        await dequeueActivity(activityDoc.id);
        return;
      }

      const {
        processedQueueDoc,
        dataForIngest,
        athleteDoc,
      } = await processQueueActivity(activityDoc, isDryRun);

      if (!isDryRun) {
        let result;
        if (
          dataForIngest
          && athleteDoc instanceof Athlete
          && processedQueueDoc.status === 'shouldIngest'
        ) {
          result = await ingestActivityFromQueue(dataForIngest, athleteDoc);
        } else {
          result = false;
        }
        const forUpdate = result
          ? { status: 'ingested' }
          : { status: 'error', errorMsg: 'ingestActivity failed' };
        processedQueueDoc.set(forUpdate);
        await processedQueueDoc.save();
      }
      console.log(`processedQueueActivity() status for ${processedQueueDoc.id}: ${processedQueueDoc.status}`);
    } catch (err) {
      // Error will get sent to Sentry
      await activityDoc.update({
        status: 'error',
        errorMsg: `processQueueActivity() failed for activity ${activityDoc.id}`,
      });
    }
  }
}

module.exports = {
  processQueue,
  processQueueActivity,
};
