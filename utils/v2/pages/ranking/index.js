/**
 * Get API query path from Express params
 *
 * @param {Object} query
 * @returns {String}
 */
function getApiQueryPath(
  [reqPrimary = '', reqSecondary = ''],
) {
  // @todo Update from actual month
  return `/v2/ranking/${reqPrimary}/01`;
}

module.exports = {
  getApiQueryPath,
};
