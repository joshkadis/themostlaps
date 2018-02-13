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

module.exports = {
  getPathnameFromContext,
};
