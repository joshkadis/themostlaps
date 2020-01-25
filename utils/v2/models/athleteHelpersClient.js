/**
 * Check stats for all locations to see if rider
 * has ever ridden anywhere
 *
 * @param {Object} locations
 * @returns {Boolean}
 */
function riderHasLapsAnywhere(locations = {}) {
  return Object.keys(locations).reduce(
    (hasLaps, locName) => hasLaps || locations[locName].allTime,
    false,
  );
}

module.exports = {
  riderHasLapsAnywhere,
};
