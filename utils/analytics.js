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
 * @param {Object} fields Non-persistent custom dimensions
 * @param {Bool} setPageDimensions Defaults to true, updates page-level dimensions
 */
function trackPageview(pathname, fields = {}, setPageDimensions = true) {
  if (setPageDimensions) {
    _ga('set', {
      location: window.location.href,
      title: getDocumentTitle(pathname),
      page: window.location.pathname,
    });
  }
  _ga('send', 'pageview', fields);
}

/**
 * Track custom event
 *
 * @param {String} category Event category
 * @param {String} action Event action
 * @param {String} label Event label
 * @param {Number} value Event value
 * @param {Object} fields Non-persistent custom dimensions
 */
function trackEvent(...args) {
  if ('string' !== typeof args[0]) {
    return;
  }
  _ga('send', 'event', ...args);
}

/**
 * Track modal open to start signup process
 *
 * @param {String} label
 */
function trackModalOpen(label = '') {
  trackEvent('signup', 'openModal', label);
}

/**
 * Set persistent custom dimensions from key-value strings or object
 *
 * @param {String|Object} key String of key or object of key-value pairs
 * @param {String} value Used as value only if key is a string
 */
function setDimensions(key = false, value) {
  if ('object' === typeof key) {
    _ga('set', key);
  } else if ('string' === typeof key && 'string' === typeof value) {
    _ga('set', key, value);
  }
}


module.exports = {
  trackPageview,
  trackEvent,
  setDimensions,
  trackModalOpen,
};
