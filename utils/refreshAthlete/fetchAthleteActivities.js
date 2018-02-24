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
 * @return {Promise}
 */
function fetchAllAthleteActivities(
  token,
  afterTimestamp,
  page = 1,
  allActivities = []
) {
  const url = `${config.apiUrl}/athlete/activities?after=${afterTimestamp}&page=${page}`;
  console.log(`Fetching ${url}`)
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  .then((response) => response.json())
  .then((activities) => {
    if (!activities.length) {
      return allActivities;
    }
    return fetchAllAthleteActivities(
      token,
      afterTimestamp,
      (page + 1),
      allActivities.concat(activities)
    );
  });
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
    console.log(`Activity ${id} already saved`);
  } else {
    console.log(`Activity ${id} not already saved`);
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
 * @return {Array}
 */
module.exports = async (token, afterTimestamp) => {
  return fetchAllAthleteActivities(token, afterTimestamp)
    .then(async (activities) => {
      const eligibleActivities = [];
      for (let i = 0; i < activities.length; i++) {
        const isEligible = await activityIsEligible(activities[i]);
        if (isEligible) {
          eligibleActivities.push(activities[i]);
        }
      }
      console.log(`Activities: ${activities.length} total; ${eligibleActivities.length} eligible`);
      return eligibleActivities;
    })
    .then((activities) => {
      return activities.map(({ id }) => id);
    });
}
