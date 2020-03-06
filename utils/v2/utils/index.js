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
 * Match a case-insensitive API request type to
 * a case-sensitive field in the Athlete document
 *
 * @param {String} type Case-insensitive request type
 * @returns {String|false}
 */
function getStatsFieldFromRankingType(type) {
  switch (type.toLowerCase()) {
    case 'single':
      return 'single';

    case 'activities':
    case 'numactivities':
      return 'numActivities';

    case 'alltime':
      return 'allTime';

    default:
      return false;
  }
}

module.exports = {
  getStatsFieldFromRankingType,
  sortUniq,
};
