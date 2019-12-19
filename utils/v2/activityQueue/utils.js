const QueueActivity = require('../../../schema/QueueActivity');

/**
 * Keep an activity in the DB but change its status property
 *
 * @param {QueueActivity|Integer} activity QueueActivity document or ID
 * @param {String} status Status to apply
 * @returns {Bool} Success or failure
 */
async function updateActivityStatus(activity, status) {
  let success = false;
  try {
    if (activity instanceof QueueActivity) {
      success = await activity.update({
        status,
      });
    } else {
      success = await QueueActivity.findOneAndUpdate(
        { activityId: activity },
        { status },
        { runValidators: true },
      );
    }
    return !!success;
  } catch (err) {
    return false;
  }
}

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
    const updated = await updateActivityStatus(activityId, 'pending');
    if (updated) {
      return true;
    }
    const success = await QueueActivity.create(doc);
    return !!success;
  } catch (err) {
    return false;
  }
}

/**
 * Keep an activity in the DB but stop ingestion attempts
 *
 * @param {QueueActivity|Integer} activity QueueActivity document or ID
 * @returns {Bool} Success or failure
 */
async function dequeueActivity(activity) {
  try {
    const success = await updateActivityStatus(activity, 'dequeued');
    return !!success;
  } catch (err) {
    return false;
  }
}

/**
 * Delete activity from ingestion queue
 *
 * @param {Integer} activityId
 */
async function deleteActivity(activityId) {
  return QueueActivity.findOneAndRemove({
    activityId,
  });
}

module.exports = {
  enqueueActivity,
  dequeueActivity,
  deleteActivity,
  updateActivityStatus,
};
