require('isomorphic-fetch');
const config = require('../../config');
const calculateLapsFromSegmentEfforts =
  require('./calculateLapsFromSegmentEfforts');
const { formatSegmentEffort } = require('../athleteHistory');

/**
 * Filter segment efforts for activity
 *
 * @param {Array} efforts
 * @return {Array}
 */
function filterSegmentEfforts(efforts) {
  return efforts
    .filter(({ segment }) => config.lapSegmentId === segment.id)
    .map((effort) => formatSegmentEffort(effort));
}

/**
 * Get laps data object from an activity
 *
 * @param {Object} activity
 * @param {Boolean} verbose Defaults to false
 * @return {Object|false}
 */
function formatActivityData(activity, verbose = false) {
  const {
    id,
    athlete,
    segment_efforts,
    start_date_local,
  } = activity;

  const laps = calculateLapsFromSegmentEfforts(segment_efforts);
  if (verbose) {
    console.log(`Activity ${id} has ${laps} laps`);
  }

  if (!laps) {
    return false;
  }

  const added = new Date();
  return {
    _id: id,
    added_date: added.toISOString(),
    athlete_id: athlete.id,
    laps,
    segment_efforts: filterSegmentEfforts(segment_efforts),
    source: 'refresh',
    start_date_local,
  };
}

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
async function fetchActivityDetails(activityIds, token, idx = 0, allActivities, verbose = false) {
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

  const activityData = formatActivityData(activity, verbose);
  if(activityData) {
    allActivities.push(activityData);
  }

  if ((idx + 1) === fetchNum) {
    return allActivities;
  }
  return await fetchActivityDetails(activityIds, token, (idx + 1), allActivities, verbose);
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
