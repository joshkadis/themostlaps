require('isomorphic-fetch');
const config = require('../../config');
const calculateLapsFromSegmentEfforts =
  require('./calculateLapsFromSegmentEfforts');
/**
 * Get laps data object from an activity
 *
 * @param {Object} activity
 * @param {Boolean} verbose Defaults to false
 * @return {Object|false}
 */
function getActivityData(activity, verbose = false) {
  const {
    id,
    start_date_local,
    total_elevation_gain,
    athlete,
    start_latlng,
    end_latlng,
    segment_efforts,
  } = activity;

  const laps = calculateLapsFromSegmentEfforts(segment_efforts);
  if (verbose) {
    console.log(`Activity ${id} has ${laps} laps`);
  }

  if (!laps) {
    return false;
  }

  return {
    _id: id,
    start_date_local,
    total_elevation_gain,
    athlete_id: athlete.id,
    start_latlng,
    end_latlng,
    segment_efforts,
    laps,
  };
}

/**
 * Iterate over activity ids list and get laps.
 * Fetch sequentially for API rate limiting.
 *
 * @param {Array} activityIds
 * @param {String} token
 * @param {Int} idx
 * @param {Object} allLaps
 * @param {Boolean} verbose Defaults to false
 * @return {Object}
 */
async function fetchActivityDetails(activityIds, token, idx = 0, allLaps, verbose = false) {
  const fetchNum = 'development' === process.env.NODE_ENV ? config.devFetchActivities : activityIds.length;

  if (verbose) {
    console.log(`Fetching ${(idx + 1)} of ${fetchNum}: ${activityIds[idx]}`)
  }

  const response = await fetch(`${config.apiUrl}/activities/${activityIds[idx]}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const activity = await response.json();

  const activityLaps = getActivityData(activity, verbose);
  if(activityLaps) {
    allLaps.push(activityLaps);
  }

  if ((idx + 1) === fetchNum) {
    return allLaps;
  }
  return await fetchActivityDetails(activityIds, token, (idx + 1), allLaps, verbose);
}

/**
 * Iterate over array of activities and fetch laps for each one
 *
 * @param {Array} activityIds List of eligible activities
 * @param {String} token User token
 * @param {Boolean} verbose Defaults to false
 * @return {Array}
 */
module.exports = async (activityIds, token, verbose = false) => {
  return await fetchActivityDetails(activityIds, token, 0, [], verbose);
};
