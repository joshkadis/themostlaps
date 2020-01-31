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

/**
 * Get Date object from Activity document. Assume difference between
 * local timezone and UTC doesn't matter.
 *
 * @param {Activity} activity
 * @param {String} activity.start_date_local All docs should have this
 * @param {Date} activity.startDateUtc Older docs might not have this
 * @returns {Date} Will return current Date if neither prop is found
 */
const getDateFromActivity = ({
  start_date_local = '',
  startDateUtc = false,
}) => (startDateUtc || new Date(start_date_local));

module.exports = {
  getDateFromActivity,
  compareActivityLocations,
};
