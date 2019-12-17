const QueueActivity = require('../../../schema/QueueActivity');
const Athlete = require('../../../schema/Athlete');
const { fetchActivity } = require('../../refreshAthlete/utils');

const MAX_INGEST_ATTEMPTS = 8;

/**
 * Add a newly created activity to the ingestion queue
 *
 * @param {Object} webhookData
 * @param {Integer} webhookData.object_id Strava activity ID
 * @param {Integer} webhookData.owner_id Strava athlete ID
 * @param {Integer} webhookData.event_time Timestamp of activity creation
 * @returns {Bool} Success or failure
 */

async function enqueueActivity({
  object_id: activityId,
  owner_id: athleteId,
  event_time: createdAt = Date.now(),
}) {
  const doc = {
    activityId,
    athleteId,
    createdAt,
  };

  try {
    await QueueActivity.create(doc);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Keep an activity in the DB but stop ingestion attempts
 *
 * @param {QueueActivity|Integer} activity QueueActivity document or ID
 */
async function dequeueActivity(activity) {
  if (activity instanceof QueueActivity) {
    await activity.update({
      status: 'dequeued',
    });
    return;
  }

  await QueueActivity.findOneAndUpdate(
    { activity },
    { status: 'dequeued' },
  );
}

/**
 * Delete activity from ingestion queue
 *
 * @param {Integer} activityId
 */
async function deleteActivity(activityId) {
  await QueueActivity.findOneandDelete({
    activityId,
  });
}

/**
 * Process an activity in the queue and return updated document
 *
 * @param {QueueActivity} queueDoc QueueActivity document
 * @param {Bool} isDryRun Default to false
 * @return {QueueActivity}
 */
async function processQueueActivity(queueDoc, isDryRun = false) {
  const activityId = queueDoc.get('activityId');
  const athleteDoc = await Athlete.findById(queueDoc.get('athleteId'));
  if (!athleteDoc) {
    queueDoc.set({
      status: 'error',
      errorMsg: 'No athleteDoc',
    });
    return queueDoc;
  }

  const data = await fetchActivity(activityId, athleteDoc);
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

  // Same number of segment efforts twice in a row
  // Use as proxy for Strava processing completion
  if (numSegmentEfforts === queueDoc.get('numSegmentEfforts')) {
    if (!isDryRun) {
      // refactor refreshAthleteFromActivity to start at this point with data, athleteDoc
      // set status to 'error' or 'success'
    } else {
      // Mostly for testing
      queueDoc.set({ status: 'success' });
    }
  }

  queueDoc.set({
    numSegmentEfforts,
    lastAttemptedAt: Date.now(),
    ingestAttempts: queueDoc.get('ingestAttempts') + 1,
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
  for await (const activity of activities) {
    try {
      if (activity.get('ingestAttempts') === MAX_INGEST_ATTEMPTS) {
        dequeueActivity(activity);
        return;
      }

      const processed = await processQueueActivity(activity, isDryRun);
      if (!isDryRun) {
        if (processed) {
          await processed.update({});
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
  enqueueActivity,
  dequeueActivity,
  deleteActivity,
  processQueue,
  processQueueActivity,
};
