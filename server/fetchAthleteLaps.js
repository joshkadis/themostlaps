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

/**
 * Get list of athlete's activities that might contain laps
 *
 * @param {String} token
 * @param {Response} res
 * @return {Promise}
 */
module.exports = (token, res) => {
  fetch(`${config.apiUrl}/athlete/activities?per_page=25&page=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  .then((response) => response.json())
  .then((activities) => {
    return activities.filter(({ start_latlng, end_latlng }) => {
      // return true if start or end dates within 50km of PP
      return (start_latlng && distFromParkCenter(start_latlng) < config.allowWithin) ||
        (end_latlng && distFromParkCenter(end_latlng) < config.allowWithin);
    });
  })
  .then((activities) => {
    res.send(`${activities.length} activities within allowed distance`);
  });
}
