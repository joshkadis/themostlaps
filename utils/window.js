const { breakpointPx } = require('../config');

const isSmallViewport = () => typeof window !== 'undefined'
  && typeof window.innerWidth === 'number'
  && window.innerWidth < breakpointPx;

module.exports = {
  isSmallViewport,
};
