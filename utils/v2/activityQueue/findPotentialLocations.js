const { getDistance } = require('geolib');
const {
  locations: defaultLocations,
} = require('../../../config');

/**
 * Is lat/long pair within allowedRadius from the location center we're checking?
 *
 * @param {Object} activityLatlng
 * @param {Object} locationLatlng
 * @param {Number} allowedRadius
 * @return {Boolean}
 */
function isWithinAllowedRadius(
  activityLatlng,
  locationLatlng,
  allowedRadius,
) {
  const pointsDistance = getDistance(
    activityLatlng,
    locationLatlng,
    100,
    1,
  );
  return pointsDistance <= allowedRadius;
}

/**
 * Find potential locations based on start or end latlng
 * and distance vs location's min distance
 *
 * @param {Number} activity.id
 * @param {Object} activity.start_latlng
 * @param {Object} activity.end_latlng
 * @param {Number} activity.distance
 * @param {Boolean} opts.verbose For logging
 * @param {Array} opts.loctions Array of locations to check,
 *                              default to config'd locations
 * @returns {Array} List of potential locations
 */
function findPotentialLocations(
  {
    id,
    start_latlng: activityStartPoint,
    end_latlng: activityEndPoint,
    distance: activityDistance,
  },
  opts = {},
) {
  const {
    verbose = false,
    locations = defaultLocations,
  } = opts;

  // Loop through locations and add to potentials
  // if activity is starts/ends near center and exceeds minDistance
  const potentials = Object.keys(locations).reduce((acc, locName) => {
    const {
      minDistance: locationMinDistance,
      locationCenter,
      allowedRadius,
    } = locations[locName];

    if (activityDistance < locationMinDistance) {
      return acc;
    }

    const pointIsNear = (latlng) => isWithinAllowedRadius(
      {
        latitude: latlng[0],
        longitude: latlng[1],
      },
      locationCenter,
      allowedRadius,
    );

    if (pointIsNear(activityStartPoint) || pointIsNear(activityEndPoint)) {
      acc.push(locName);
    }
    return acc;
  }, []);

  if (verbose) {
    if (!potentials.length) {
      console.log(`Activity ${id} has no potential locations.`);
    } else {
      console.log(`Activity ${id} has potential locations: ${JSON.stringify(potentials)}`);
    }
  }
  return potentials;
}

module.exports = {
  findPotentialLocations,
};
