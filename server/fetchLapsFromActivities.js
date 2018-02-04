require('isomorphic-fetch');
const config = require('../config');

/**
 * Get laps data object from an activity
 *
 * @param {Object} activity
 * @return {Object|false}
 */
function getLapsFromActivity({ id, start_date_local, segment_efforts = [] }) {
  const lapCount = segment_efforts.reduce((acc, { segment }) =>
    (segment.id === config.lapSegmentId ? (acc + 1) : acc), 0);

  if (0 === lapCount) {
    return false;
  }
  const date = start_date_local.split('T')[0];

  return {
     [date]: {
      id,
      date,
      laps: (config.addMakeupLap ? (lapCount + 1) : lapCount),
    },
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
  console.log(`Fetching ${(idx + 1)} of ${activityIds.length}: ${activityIds[idx]}`)
  return fetch(`${config.apiUrl}/activities/${activityIds[idx]}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  .then((response) => response.json())
  .then((activity) => {
    const activityLaps = getLapsFromActivity(activity);
    const updatedLaps = activityLaps ? Object.assign(allLaps, activityLaps) : allLaps;
    if (idx === (activityIds.length - 1)) {
      return updatedLaps;
    }
    return fetchActivityDetails(activityIds, token, (idx + 1), updatedLaps);
  });
}


/**
 * Iterate over array of activities and fetch laps for each one
 *
 * @param {Array} activityIds List of eligible activities
 * @param {String} token User token
 * @return {Object} Map of date:laps
 */
module.exports = (activityIds, token) => {
  return fetchActivityDetails(activityIds, token, 0, {})
    .then((laps) => laps);
};
