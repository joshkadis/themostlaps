/**
 * Get API query path from Express params
 *
 * @param {Object} query
 * @returns {String}
 */
function getQueryPath(
  [reqPrimary = 'allTime', reqSecondary = ''],
) {
  return `/${reqPrimary}${reqSecondary ? `/${reqSecondary}` : ''}`;
}

module.exports = {
  getQueryPath,
};
