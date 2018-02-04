require('isomorphic-fetch');
const getDistance = require('geolib').getDistance;
const config = require('../config');

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

function getActivities(token, page = 1, allActivities = []) {
  const url = `${config.apiUrl}/athlete/activities?per_page=200&page=${page}`;
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
    return getActivities(token, (page + 1), allActivities.concat(activities));
  });
}

/**
 * Get list of athlete's activities that might contain laps
 *
 * @param {String} token
 * @param {Response} res
 * @return {Promise}
 */
module.exports = (token, res) => {
  getActivities(token)
    .then((activities) => {
      console.log(`Found ${activities.length} total activities`);
      return activities.filter(({ start_latlng, end_latlng }) => {
        // return true if start or end dates within 50km of PP
        return (start_latlng && distFromParkCenter(start_latlng) < config.allowedRadius) ||
          (end_latlng && distFromParkCenter(end_latlng) < config.allowedRadius);
      });
    })
    .then((activities) => {
      const msg = `${activities.length} activities within allowed radius`;
      console.log(msg);
      res.send(msg);
    });
}
