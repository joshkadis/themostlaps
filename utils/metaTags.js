const {
  isLocalEnv,
  getEnvOrigin,
} = require('./envUtils');
const { openGraph } = require('../config/content');

/**
 * Get title for document
 *
 * @param {String} pathname Next pathname for current page
 * @return {String}
 */
function getDocumentTitle(pathname) {
  // Showing pathname in page tab is slightly useful in development;
  return isLocalEnv() ? pathname : 'The Most Laps';
}

/**
 * Get traversable pairs of data for OG tags
 *
 * @return {Array}
 */
function getOgData() {
  return openGraph.concat([
    ['image', `${getEnvOrigin()}/static/img/themostlaps_og.jpg`],
    ['url', getEnvOrigin()],
  ]);
}

module.exports = {
  getDocumentTitle,
  getOgData,
};
