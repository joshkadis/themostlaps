const { prodDomain } = require('../config');

function _hasWindowOrigin() {
  return 'undefined' !== typeof window &&
    window.location &&
    window.location.origin &&
    window.location.origin.indexOf &&
    window.location.origin.indexOf('http') === 0;
};

function isProduction() {
  if (_hasWindowOrigin()) {
    return prodDomain === window.location.host;
  }

  return 'production' === process.env.NODE_ENV;
}

function getEnvOrigin() {
  if (_hasWindowOrigin()) {
    return window.location.origin;
  }

  return isProduction() ?
    `https://${prodDomain}` :
    `http://localhost:${process.env.PORT}`;
}

module.exports = {
  isProduction,
  getEnvOrigin,
};
