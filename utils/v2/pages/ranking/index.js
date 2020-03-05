const { getMonthName } = require('../../../dateTimeUtils');

const PAGE_TITLES = {
  single: 'Longest Ride',
  activities: 'Rides With Laps',
  allTime: 'The Most Laps',
  default: 'Laps',
};

/**
 * Get API query path from Express request params
 * Assume that Express routing has already validated params
 *
 * @param {String} reqPrimary
 * @param {String} reqSecondary
 * @returns {String}
 */
function getApiQueryPath(reqPrimary = '', reqSecondary = '') {
  // Assume reqPrimary is a valid type (e.g. 'single') or YYYY
  // and reqSecondary is a valid MM string if it's provided
  const shouldUseMonth = /\d{4}/.test(reqPrimary) && /\d{2}/.test(reqSecondary);

  return `/v2/ranking/${reqPrimary}${shouldUseMonth ? `/${reqSecondary}` : ''}`;
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
