require('isomorphic-fetch');
const config = require('../config');

/**
 * Get laps data object from an activity
 *
 * @param {Object} activity
 * @return {Object|false}
 */
function getActivityData(activity) {
  const {
    id,
    start_date_local,
    total_elevation_gain,
    athlete,
    start_latlng,
    end_latlng,
    segment_efforts,
  } = activity;

  let estimated_laps = segment_efforts.reduce((acc, { segment }) =>
    (segment.id === config.lapSegmentId ? (acc + 1) : acc), 0);

  if (0 === estimated_laps) {
    return false;
  }

  if (config.addMakeupLap) {
    estimated_laps++;
  }

  return {
    _id: id,
    start_date_local,
    total_elevation_gain,
    athlete_id: athlete.id,
    start_latlng,
    end_latlng,
    segment_efforts,
    estimated_laps,
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
 * @return {Object}
 */
function fetchActivityDetails(activityIds, token, idx = 0, allLaps) {
  const fetchNum = 'development' === process.env.NODE_ENV ? config.devFetchActivities : activityIds.length;

  /**
   * @todo Check database to see if activity already imported
   */
  console.log(`Fetching ${(idx + 1)} of ${fetchNum}: ${activityIds[idx]}`)
  return fetch(`${config.apiUrl}/activities/${activityIds[idx]}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  .then((response) => response.json())
  .then((activity) => {
    const activityLaps = getActivityData(activity);
    if(activityLaps) {
      allLaps.push(activityLaps);
    }

    if ((idx + 1) === fetchNum) {
      return allLaps;
    }
    return fetchActivityDetails(activityIds, token, (idx + 1), allLaps);
  });
}


/**
 * Iterate over array of activities and fetch laps for each one
 *
 * @param {Array} activityIds List of eligible activities
 * @param {String} token User token
 * @return {Array}
 */
module.exports = (activityIds, token) => {
  return fetchActivityDetails(activityIds, token, 0, [])
    .then((laps) => laps);
};
