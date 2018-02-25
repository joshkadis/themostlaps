const fetch = require('isomorphic-unfetch');
const { stringify } = require('query-string');
const { getEnvOrigin } = require('./envUtils');
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

/**
 * Make request to The Most Laps API
 *
 * @param {String} path Must have leading slash
 * @param {String|Object} query String or Object to stringify
 * @param {Any} defaultResult Default to return if error
 * @return {Promise}
 */
function APIRequest(path = false, query = {}, defaultResult = {}) {
  if (!path) {
    return defaultResult;
  }

  return fetch(`${getEnvOrigin()}/api${path}?${stringify(query)}`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      return data.error ? defaultResult : data;
    });
}

module.exports = {
  getPathnameFromContext,
  getTimestampFromISO,
  APIRequest,
};
