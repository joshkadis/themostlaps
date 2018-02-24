/**
 * Get pathname without query string from Next.js context object
 * https://github.com/zeit/next.js/#fetching-data-and-component-lifecycle
 *
 * @param {Object} context
 * @return {String}
 */
function getPathnameFromContext(context = {}) {
  return 'string' === typeof context.asPath ?
    context.asPath.split('?')[0] :
    '/';
};

/**
 * Get timestamp in seconds from ISO Date string
 *
 * @param {String} dateString
 * @return {Int|Null} Integer or null if malformed input
 */
function getTimestampFromISO(dateString) {
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.valueOf())) {
    return null;
  }
  return Math.floor(dateObj.valueOf() / 1000);
}

module.exports = {
  getPathnameFromContext,
  getTimestampFromISO,
};
