/**
 * Check stats for all locations to see if rider
 * has ever ridden anywhere
 *
 * @param {Object} locations
 * @returns {Boolean}
 */
function riderHasLapsAnywhere(locations = {}) {
  return Object.keys(locations).reduce(
    (hasLaps, locName) => hasLaps || locations[locName].allTime > 0,
    false,
  );
}

/**
 * Does athlete.stats include data for location?
 *
 * @param {Object} stats
 * @param {String} location
 * @returns {Boolean}
 */
function riderHasStatsForLocation(stats = false, location = false) {
  return stats && location && typeof stats[location] !== 'undefined';
}

module.exports = {
  riderHasLapsAnywhere,
  riderHasStatsForLocation,
};
