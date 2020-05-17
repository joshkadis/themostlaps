const { getDocumentTitle } = require('./metaTags');
const { customDimensions } = require('../config/analytics');

/**
 * Check for window.ga to avoid server-side errors by accident
 */
function _ga(...args) {
  if (typeof window !== 'undefined' && window.ga) {
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
  let currentIsAuthResult = false;
  let currentPathname;
  ga((tracker) => {
    currentPathname = tracker.get('page');
    currentIsAuthResult = /\?auth(success|error)=/.test(tracker.get('location'));
  });

  if (setPageDimensions) {
    _ga('set', {
      location: window.location.href,
      title: getDocumentTitle(pathname),
      page: window.location.pathname,
    });
  }

  // If we're staying on the same page and just closing the modal after OAuth
  // don't track a pageview
  if (!currentIsAuthResult || currentPathname !== window.location.pathname) {
    _ga('send', 'pageview', fields);
  }
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
  if (typeof args[0] !== 'string') {
    return;
  }
  _ga('send', 'event', ...args);
}

/**
 * Track modal open to start signup process
 *
 * @param {String} label
 */
function trackModalOpen() {
  trackEvent('signup', 'openModal');
}

/**
 * Track click on the Connect With Strava Button
 *
 * @param {Bool} withSubscribe
 */
function trackConnectWithStrava(withSubscribe = false) {
  trackEvent('signup', 'connectWithStrava', (withSubscribe ? 'withSubscribe' : 'noSubscribe'));
}

/**
 * Track authorization result
 *
 * @param {Bool} success
 * @param {Number} errorCode Optional code if error
 */
function trackAuthResult(success, errorCode = null) {
  // Set persistent dimensions
  const dimensions = {
    'Signup Result': success ? 'success' : 'error',
  };
  if (!success && errorCode !== null) {
    dimensions['Signup Error Code'] = errorCode.toString();
  }
  setDimensions(dimensions);

  // Track event with outcome as event label
  trackEvent('signup', 'result', success ? 'success' : 'error');
}

/**
 * Track social interaction
 *
 * @param {String} network
 * @param {String} action
 * @param {String} target
 */
function trackSocial(network, action, target) {
  _ga('send', 'social', network, action, target);
}

/**
 * Track ranking selector interaction
 *
 * @param {String} action
 * @param {String} label
 */
function trackRankingSelector(action, label = '') {
  trackEvent('rankingSelector', action, label);
}

/**
 * Set persistent custom dimensions from key-value object with
 * names like 'User Has Connected' instead of 'dimension1'
 *
 * @param {Object} namedDimensions
 */
function setDimensions(namedDimensions) {
  const dimensions = Object.keys(namedDimensions).reduce((acc, inputKey) => {
    // Handle input already in 'dimension1' format
    if (/dimension\d+/.test(inputKey)) {
      acc[inputKey] = namedDimensions[inputKey].toString();
    } else {
      const dimensionKey = getDimensionKey(inputKey);
      if (dimensionKey) {
        acc[dimensionKey] = namedDimensions[inputKey].toString();
      }
    }
    return acc;
  }, {});
  _ga('set', dimensions);
  return dimensions; // for unit test
}

/**
 * Get custom dimension key from name, e.g. 'User Has Connected' -> 'dimension1'
 *
 * @param {String} name
 * @return {String|Bool}
 */
const getDimensionKey = (name) => (customDimensions[name] || false);

module.exports = {
  trackPageview,
  trackEvent,
  setDimensions,
  trackModalOpen,
  trackConnectWithStrava,
  trackAuthResult,
  trackSocial,
  trackRankingSelector,
};
