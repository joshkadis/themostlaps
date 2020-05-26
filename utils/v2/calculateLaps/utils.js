const {
  getDistance,
} = require('geolib');

/**
 * Get potential locations where this ride could have laps
 * and min distance to each perimeter of location
 *
 * @param {Array} startPoint lat/lon pair
 * @param {Object} allLocations Locations data to look for, e.g. config.locations
 * @returns {Object} Object with distToCenter and distToPerimeter for each location
 */
const getDistsToLocations = (
  startPoint,
  allLocations,
  maxDistance = 50000,
) => Object.keys(allLocations)
  .reduce(
    (acc, locName) => {
      // eslint-disable-next-line max-len
      const {
        locationCenter: { latitude: lat, longitude: lon },
        maxLapRadius,
        locationName,
      } = allLocations[locName];
      const distToCenter = parseInt(
        getDistance(startPoint, [lat, lon], 50),
        10,
      );
      const distToPerimeter = parseInt((distToCenter - maxLapRadius), 10);
      if (distToPerimeter > maxDistance) {
        return acc;
      }
      return {
        ...acc,
        [locationName]: {
          locationCenter: [lat, lon],
          maxLapRadius,
          locationName,
          distToCenter,
          distToPerimeter,
        },
      };
    },
    {},
  );

/**
 * Get name of first location where we're close enough to start looking for laps
 * Assumes that locations aren't super close to each other
 *
 * @param {Object} locationsDists
 * @returns {String} Name of current location if found
 */
const getCurrentLocation = (locationsDists) => Object.keys(locationsDists)
  .reduce((current, locName) => {
    if (!current && locationsDists[locName].distToPerimeter <= 0) {
      return locName;
    }
    return current;
  }, '');

module.exports = {
  getDistsToLocations,
  getCurrentLocation,
};

/**
 * Update locationsDists
 *
 * @param {Array} currentPoint [lat,lon]
 * @param {Object} locationsDists
 *
 */
