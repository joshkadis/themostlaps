const { getMonthName } = require('../../../dateTimeUtils');

const PAGE_TITLES = {
  single: 'Longest Ride',
  activities: 'Rides With Laps',
  allTime: 'The Most Laps',
  default: 'Laps',
};

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
  return `/v2/ranking/${reqPrimary}${/\d+/.test(reqPrimary) ? '/01' : ''}`;
}

/**
 * Get page title from primary and secondary query params
 *
 * @param {String} primary
 * @param {String} secondary
 * @returns {String} Page title
 */
function getPageTitle(primary = 'default', secondary = '0') {
  if (/^\d+/.test(primary.toString())) {
    const secondaryIdx = secondary
      ? parseInt(secondary, 10)
      : 0;
    return secondaryIdx
      ? `${getMonthName(secondaryIdx)} ${primary}`
      : primary.toString();
  }
  return PAGE_TITLES[primary] || PAGE_TITLES.default;
}

module.exports = {
  getPageTitle,
  getApiQueryPath,
};
