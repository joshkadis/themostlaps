const { breakpointPx } = require('../config');

const isSmallViewport = () =>
  'undefined' !== typeof window &&
  'number' === typeof window.innerWidth &&
  window.innerWidth < breakpointPx;

module.exports = {
  isSmallViewport,
};
