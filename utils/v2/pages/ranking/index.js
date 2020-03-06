const { getMonthName } = require('../../../dateTimeUtils');

const PAGE_TITLES = {
  single: 'Longest Ride',
  activities: 'Most Rides With Laps',
  alltime: 'The Most Laps',
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

  // API route will handle reqPrimary as case-insensitive
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
  // Handle year or month rankings
  if (/^\d+/.test(primary.toString())) {
    const monthIdx = secondary
      ? parseInt(secondary, 10)
      : 0;
    return monthIdx
      ? `Laps for ${getMonthName(monthIdx)} ${primary}`
      : `Laps for ${primary.toString()}`;
  }

  // Other ranking types
  const key = primary.toLowerCase();
  return PAGE_TITLES[key] || PAGE_TITLES.default;
}

module.exports = {
  getPageTitle,
  getApiQueryPath,
};
