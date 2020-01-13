const { devFetchActivities } = require('../../config');
const { fetchActivity, getActivityData } = require('./utils');

/**
 * Iterate over activity ids list and get laps.
 * Fetch sequentially for API rate limiting.
 *
 * @param {Array} activityIds
 * @param {String} token
 * @param {Int} idx
 * @param {Object} allActivities
 * @param {Boolean} verbose Defaults to false
 * @return {Object}
 */
async function fetchActivityDetails(
  activityIds,
  token,
  idx = 0,
  allActivities,
  verbose = false,
) {
  let fetchNum = activityIds.length;
  if (process.env.NODE_ENV === 'development' && fetchNum > devFetchActivities) {
    console.log(`Limiting number of fetchted activities to ${devFetchActivities} for development use`);
    fetchNum = devFetchActivities;
  }

  if (verbose) {
    console.log(`Fetching ${(idx + 1)} of ${fetchNum}: ${activityIds[idx]}`);
  }

  try {
    const activity = await fetchActivity(activityIds[idx], token);
    if (typeof activity !== 'undefined' && activity) {
      const activityData = getActivityData(activity, verbose);
      if (activityData && activityData.laps) {
        allActivities.push(activityData);
      }
    }
  } catch (err) {
    console.log(`Error processing activity ${activityIds[idx]}`);
    console.log(err);
  }

  if ((idx + 1) === fetchNum) {
    return allActivities;
  }
  return fetchActivityDetails(
    activityIds,
    token,
    (idx + 1),
    allActivities,
    verbose,
  );
}

/**
 * Iterate over array of activities and fetch laps for each one
 *
 * @param {Array} activityIds List of eligible activities
 * @param {String} token User token
 * @param {Boolean} verbose Defaults to false
 * @return {Array}
 */
async function fetchLapsFromActivities(
  activityIds,
  token,
  verbose = false,
) {
  return fetchActivityDetails(activityIds, token, 0, [], verbose);
}

module.exports = fetchLapsFromActivities;
