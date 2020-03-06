const _sortBy = require('lodash/sortBy');
const _uniq = require('lodash/uniq');

/**
 * Reduce array to sorted uniq values
 * which must be sortable e.g. Number, String
 *
 * @param {Array} arr
 * @returns {Array}
 */
const sortUniq = (arr) => _sortBy(_uniq(arr), [(val) => val]);

/**
 * Get case-sensitive request type. Pretty hacky.
 *
 * @param {String} type Case-insensitive request type
 * @returns {String|false}
 */
function getCaseSensitiveRequestType(type) {
  // @todo Clean up 'activities' vs 'numActivities'
  // Should be 'activities' everywhere except DB query
  switch (type.toLowerCase()) {
    case 'single':
      return 'single';

    case 'activities':
      return 'activities';

    case 'numactivities':
      return 'numActivities';

    case 'alltime':
      return 'allTime';

    default:
      return false;
  }
}

module.exports = {
  getCaseSensitiveRequestType,
  sortUniq,
};
