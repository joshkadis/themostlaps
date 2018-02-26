const { startYear } = require('../config/rankingsOpts');
/**
 * Get under-the-hood params from /ranking route
 *
 * @param {Object} reqParams
 * @return {Object}
 */
function getRankingParams(reqParams = {}) {
  const params = {
    type: false,
    year: null,
    month: null,
  };

  // type and year from first param
  if (!reqParams[0] || reqParams[0] === '') {
    params.type = 'allTime';
  } else if (/\d{4,4}/.test(reqParams[0])) {
    const year = parseInt(reqParams[0], 10);
    // Year must be in range
    const current = new Date();
    if (year >= startYear && year <= current.getFullYear()) {
      params.type = 'timePeriod';
      params.year = year;
    }
  } else {
    params.type = reqParams[0];
  }

  // month if found
  if (params.type === 'timePeriod' &&
    reqParams[1] &&
    /\d{2,2}/.test(reqParams[1])
  ) {
    const month = parseInt(reqParams[1], 10);
    // Month must be 1-12
    if (month > 0 && month < 13) {
      params.month = month;
    } else {
      // Reset if invalid month
      params.type = false;
      params.year = null;
    }
  }

  return params;
}

module.exports = getRankingParams;
