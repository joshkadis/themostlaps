require('isomorphic-fetch');
const getDistance = require('geolib').getDistance;
const Activity = require('../../schema/Activity');
const config = require('../../config');

/**
 * Get distance of [lat,lng] point from park center
 *
 * @param {Array} latlng
 * @return {Number}
 */
function distFromParkCenter(latlng = null) {
  if (!latlng || 2 !== latlng.length) {
    return null;
  }

  return getDistance(
    config.parkCenter,
    {
      latitude: latlng[0],
      longitude: latlng[1],
    },
    100,
    1
  );
}

/**
 * Get all of a user's activities by iterating recursively over paginated API results
 *
 * @param {String} token
 * @param {Int} afterTimestamp
 * @param {Array} allActivities
 * @param {Boolean} verbose Defaults to false
 * @return {Promise}
 */
async function fetchAllAthleteActivities(
  token,
  afterTimestamp,
  page = 1,
  allActivities = [],
  verbose = false
) {
  const url = `${config.apiUrl}/athlete/activities?after=${afterTimestamp}&page=${page}`;

  if (verbose) {
    console.log(`Fetching ${url}`);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const activities = await response.json();

  if (!activities.length) {
    return allActivities;
  }

  return await fetchAllAthleteActivities(
    token,
    afterTimestamp,
    (page + 1),
    allActivities.concat(activities),
    verbose
  );
}

/**
 * Should activity be checked for laps? Must be longer than min distance and
 * starting or ending within allowed radius of park center
 *
 * @param {Int} id
 * @param {Bool} trainer
 * @param {Bool} manual
 * @param {Array} start_latlng
 * @param {Array} end_latlng
 * @param {Float} distance
 * @return {Bool}
 */
async function activityIsEligible({
  id = 0,
  trainer = false,
  manual = false,
  start_latlng = null,
  end_latlng = null,
  distance = 0,
}) {
  const exists = await Activity.findById(id);
  if (exists) {
    return false;
  }

  if (manual || trainer || distance < config.minDistance) {
    return false;
  }

  return (start_latlng && distFromParkCenter(start_latlng) < config.allowedRadius) ||
    (end_latlng && distFromParkCenter(end_latlng) < config.allowedRadius);
}

/**
 * Get list of athlete's activity IDs that *might* contain laps
 *
 * @param {String} token
 * @param {Int} afterTimestamp
 * @param {Boolean} verbose Defaults to false
 * @return {Array}
 */
module.exports = async (token, afterTimestamp, verbose = false) => {
  const activities = await fetchAllAthleteActivities(token, afterTimestamp, 1, [], verbose);

  const eligibleActivities = [];
  for (let i = 0; i < activities.length; i++) {
    const isEligible = await activityIsEligible(activities[i]);
    if (isEligible) {
      eligibleActivities.push(activities[i]);
    }
  }

  if (verbose) {
    console.log(`Activities: ${activities.length} total; ${eligibleActivities.length} eligible`);
  }

  return eligibleActivities.map(({ id }) => id);
}
