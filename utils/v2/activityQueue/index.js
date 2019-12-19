const QueueActivity = require('../../../schema/QueueActivity');
const Athlete = require('../../../schema/Athlete');
const { fetchActivity } = require('../../refreshAthlete/utils');
const {
  dequeueActivity,
} = require('./utils');
const { ingestActivity } = require('./ingestActivity');

const MAX_INGEST_ATTEMPTS = 8;

/**
 * Process an activity in the queue and return updated document
 *
 * @param {QueueActivity} queueDoc QueueActivity document
 * @param {Bool} isDryRun Default to false
 * @return {QueueActivity}
 */
async function processQueueActivity(queueDoc, isDryRun = false) {
  if (queueDoc.get('status') !== 'pending') {
    console.warn(`Attempted to ingest queue activity ${queueDoc.id} with status ${queueDoc.status}`);
    return queueDoc;
  }

  const activityId = queueDoc.get('activityId');
  const athleteDoc = await Athlete.findById(queueDoc.get('athleteId'));
  if (!athleteDoc) {
    queueDoc.set({
      status: 'error',
      errorMsg: 'No athleteDoc',
    });
    return queueDoc;
  }

  let data = false;
  try {
    data = await fetchActivity(activityId, athleteDoc);
  } catch (err) {
    // i think we're ok here without doing anything
  }

  if (!data) {
    queueDoc.set({
      status: 'error',
      errorMsg: 'No fetchActivity response',
    });
    return queueDoc;
  }

  const numSegmentEfforts = data.segment_efforts
    ? data.segment_efforts.length
    : 0;

  // Look for same number of segment efforts twice in a row
  // Use this as proxy for Strava processing having completed
  if (
    numSegmentEfforts > 0
    && numSegmentEfforts === queueDoc.get('numSegmentEfforts')
  ) {
    if (!isDryRun) {
      const result = ingestActivity(data, athleteDoc);
      const forUpdate = result
        ? { status: 'success ' }
        : { status: 'error', errorMsg: 'ingestActivity failed' };
      queueDoc.set(forUpdate);
    } else {
      // Mostly for testing
      queueDoc.set({ status: 'success' });
    }
  }

  const ingestAttempts = queueDoc.get('ingestAttempts')
    ? queueDoc.get('ingestAttempts') + 1
    : 1;

  queueDoc.set({
    numSegmentEfforts,
    lastAttemptedAt: Date.now(),
    ingestAttempts,
  });

  return queueDoc;
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
  for await (let activity of activities) {
    try {
      if (activity.get('ingestAttempts') === MAX_INGEST_ATTEMPTS) {
        dequeueActivity(activity);
        return;
      }

      activity = await processQueueActivity(activity, isDryRun);
      if (!isDryRun) {
        // @todo Handle status and save, delete if success, etc.
        if (activity) {
          await activity.save();
        } else {
          dequeueActivity(activity);
        }
      }
    } catch (err) {
      // Error will get sent to Sentry
    }
  }
}

module.exports = {
  processQueue,
  processQueueActivity,
};
