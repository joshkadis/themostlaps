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

module.exports = {
  sortUniq,
};
