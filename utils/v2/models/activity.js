const { defaultLocation } = require('../../../config');
/**
 * Set laps and location by comparing two Activity docs
 * Assume both documents have been validated
 *
 * @param {Activity} newDoc
 * @param {Activity} oldDoc
 * @returns {Object} laps and location if an update is needed, or empty object
 */
function compareActivityLocations(
  { laps: newLaps = 0 },
  { laps: oldLaps = 0, location: oldLocation = defaultLocation },
) {
  if (newLaps >= oldLaps) {
    // No need to update newDoc
    return {};
  }

  return {
    laps: oldLaps,
    location: oldLocation,
  };
}

module.exports = {
  compareActivityLocations,
};
