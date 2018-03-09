const { getDocumentTitle } = require('./metaTags');

/**
 * Check for window.ga to avoid server-side errors by accident
 */
function _ga(...args) {
  if ('undefined' !== typeof window && window.ga) {
    ga(...args);
  }
}

/**
 * Track a pageview
 * @param {String} pathname From Next Router
 * @param {Bool} setDimensions Defaults to true, updates page-level dimensions
 */
function trackPageview(pathname, setDimensions = true) {
  if (setDimensions) {
    _ga('set', {
      location: window.location.href,
      title: getDocumentTitle(pathname),
      page: window.location.pathname,
    });
  }
  _ga('send', 'pageview');
}

module.exports = {
  trackPageview,
};
