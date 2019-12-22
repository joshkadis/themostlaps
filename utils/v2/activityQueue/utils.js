const QueueActivity = require('../../../schema/QueueActivity');

/**
 * Keep an activity in the DB but change its status property
 *
 * @param {QueueActivity|Integer} activity QueueActivity document or ID
 * @param {String} status Status to apply
 * @param {String} message Detail or error info
 * @returns {Bool} Success or failure
 */
async function updateActivityStatus(
  activity,
  status = false,
  message = false,
) {
  // Strict check because we want to allow 0 or empty string
  // but don't want to delete existing data
  const forUpdate = {};
  if (message !== false) {
    forUpdate.errorMsg = message;
  }
  if (status !== false) {
    forUpdate.status = status;
  }

  let success = false;
  try {
    if (activity instanceof QueueActivity) {
      success = await activity.updateOne(forUpdate);
    } else {
      success = await QueueActivity.findOneAndUpdate(
        { activityId: activity },
        forUpdate,
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
 *                                         expected in seconds
 * @param {String} message Detail or error info
 * @returns {Bool} Success or failure
 */

async function enqueueActivity({
  object_id: activityId,
  owner_id: athleteId,
  event_time = 0,
}, message = false) {
  const createdAt = event_time > 0
    ? event_time * 1000 // seconds to milliseconds
    : Date.now();

  const doc = {
    activityId,
    athleteId,
    createdAt,
  };
  // Check strictly to allow empty string
  if (message !== false) {
    doc.errorMsg = message;
  }

  try {
    const updated = await updateActivityStatus(
      activityId,
      'pending',
      message !== false ? message : false,
    );
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
 * @param {String} message Detail or error info
 * @returns {Bool} Success or failure
 */
async function dequeueActivity(activity, message = false) {
  try {
    const success = await updateActivityStatus(
      activity,
      'dequeued',
      message !== false ? message : false,
    );
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
