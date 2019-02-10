const { prodDomain } = require('../config');

function _hasWindowOrigin() {
  try {
    return window.location.origin.indexOf('http') === 0;
  } catch (err) {
    return false;
  }
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
