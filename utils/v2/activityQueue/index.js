const QueueActivity = require('../../../schema/QueueActivity');
const { slackError } = require('../../slackNotification');

// const MAX_INGEST_ATTEMPTS = 8;

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
    slackError(112, doc);
    return false;
  }
}

/**
 * Keep an activity in the DB but stop ingestion attempts
 *
 * @param {Integer} activityId
 */
async function dequeueActivity(activityId) {
  await QueueActivity.findOneAndUpdate(
    { activityId },
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

module.exports = {
  enqueueActivity,
  dequeueActivity,
  deleteActivity,
};
