// const { prodDomain } = require('../config');

function isProduction() {
  if ('undefined' !== typeof window && window.location) {
    return prodDomain === window.location.host;
  }

  return 'production' === process.env.NODE_ENV;
}

function getEnvOrigin() {
  if (
    process &&
    process.env &&
    process.env.APP_DOMAIN
  ) {
    return `https://${process.env.APP_DOMAIN}`;
  }

  if ('undefined' !== typeof window && window.location) {
    return window.location.origin;
  }

  return isProduction() ? `https://${prodDomain}` : `http://localhost:${process.env.PORT}`;
}

module.exports = {
  isProduction,
  getEnvOrigin,
};
