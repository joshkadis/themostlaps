require('isomorphic-fetch');
const Activity = require('../server/schema/activity');
const fetchAthleteActivities = require('./fetchAthleteActivities');
const fetchLapsFromActivities = require('./fetchLapsFromActivities');

/**
 * Should only create new Activity if it passes validation and
 * has not already been saved in the database
 *
 * @param {Object} activity
 * @return {Bool}
 */
const shouldCreateActivity = async (activity) => {
  const activityModel = new Activity(activity);
  const err = activityModel.validateSync();
  if (err) {
    console.warn(`Failed to validate activity ${activity._id}`);
    console.log(activity);
    return false;
  }

  const foundActivity = await Activity.findById(activity._id);
  if (foundActivity) {
    console.log(`Already saved activity ${activityId}`);
    return false;
  }

  return true;
};

/**
 * When we have an authorized athlete, fetch and save their activities
 *
 * @param {String} access_token
 * @param {Promise}
 */
module.exports = async ({ access_token }) => {
  const activityIds = await fetchAthleteActivities(access_token);

  if ('undefined' === typeof activityIds || 0 === activityIds.length) {
    return false;
  }

  const activities = await fetchLapsFromActivities(activityIds, access_token);

  if ('undefined' === typeof activities || 0 === activities.length) {
    return false;
  }

  // Filter out invalid or already saved activities
  const filteredActivities =
    activities.filter((activity) => shouldCreateActivity(activity));

  return Activity.create(filteredActivities);
};
