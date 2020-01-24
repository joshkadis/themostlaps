const _cloneDeep = require('lodash/cloneDeep');
const { defaultLocationStats } = require('../../../config/stats');
const { defaultV2Stats } = require('../../../config/stats');

/**
 * Get new object in default format for a single location
 *
 * @param {Object} overrides
 * @returns {Object}
 */
const getDefaultLocationStats = (overrides) => _cloneDeep({
  ...defaultLocationStats,
  ...overrides,
});

/**
 * Get new object in default format for athlete.stats
 *
 * @param {Object} overrides
 * @returns {Object}
 */
const getDefaultV2Stats = (overrides) => _cloneDeep({
  ...defaultV2Stats,
  ...overrides,
});

module.exports = {
  getDefaultLocationStats,
  getDefaultV2Stats,
};
