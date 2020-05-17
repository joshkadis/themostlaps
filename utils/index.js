const fetch = require('isomorphic-unfetch');
const { stringify } = require('query-string');
const { getEnvOrigin } = require('./envUtils');
const { modalQueryParams, timezoneOffset } = require('../config');

/**
 * Get pathname without query string from Next.js context object
 * https://github.com/zeit/next.js/#fetching-data-and-component-lifecycle
 *
 * @param {Object} context
 * @return {String}
 */
function getPathnameFromContext(context = {}) {
  return typeof context.asPath === 'string'
    ? context.asPath.split('?')[0]
    : '/';
}

/**
 * Get timestamp in seconds from ISO Date string
 *
 * @param {String} dateString
 * @return {Int|Null} Integer or null if malformed input
 */
function getTimestampFromLocalISO(dateString) {
  const dateObj = new Date(dateString);
  if (Number.isNaN(dateObj.valueOf())) {
    return null;
  }
  return Math.floor(dateObj.valueOf() / 1000) + timezoneOffset * 60;
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
    .then((response) => response.json())
    .then((data) => (data.error ? defaultResult : data));
}

/**
 * Get "under the hood" Next path with query string from router object
 * without modal-related query params
 *
 * @param {String} pathname
 * @param {Object} query
 * @return {String}
 */
function getPathWithQueryString({ pathname, query }) {
  return `${pathname}?${stringify(query)}`;
}

module.exports = {
  getPathnameFromContext,
  getTimestampFromLocalISO,
  APIRequest,
  getPathWithQueryString,
};
