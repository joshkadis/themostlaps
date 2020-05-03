const _isEmpty = require('lodash/isEmpty');
const { getMonthName } = require('../../dateTimeUtils');
/**
 * Transform v2 byYear object for chart display
 *
 * @param {Object} map
 * @param {Array} Array of year:value pairs
 */
function transformByYear(map = {}) {
  const years = Object.keys(map);
  if (!years.length) {
    return [];
  }

  const firstYear = Number.parseInt(years[0], 10);
  const lastYear = Number.parseInt(years[years.length - 1], 10);
  const yearsSpread = lastYear - firstYear + 1;

  const arr = Array(yearsSpread).fill({});

  return arr.map((val, idx) => {
    const year = firstYear + idx;
    return {
      year,
      value: map[year] || 0,
    };
  });
}

/**
 * Transform v2 byMonth object to map of month:value pairs
 *
 * @param {Object} data
 * @param {Array} Array of month:value pairs
 */
function transformByMonth(data = {}) {
  const years = Object.keys(data);
  if (!years.length) {
    return {};
  }

  return years.reduce((acc, year) => {
    acc[year] = data[year].map((value, monthIdx) => ({
      month: getMonthName(monthIdx + 1, 3),
      value,
    }));
    return acc;
  }, {});
}

/**
 * Transform locations object for frontend display in charts
 *
 * @param {Object} location
 * @returns {Object}
 */
function transformLocationsForRender(locations = {}) {
  return Object.keys(locations).reduce((acc, locName) => {
    if (!_isEmpty(locations[locName])) {
      const location = locations[locName];
      acc[locName] = {
        ...location,
        byYear: transformByYear(location.byYear),
        byMonth: transformByMonth(location.byMonth),
      };
    }
    return acc;
  }, {});
}

/**
 * Transform complete athlete.stats object
 *
 * @param {Object} stats
 * @returns {Object}
 */
function transformAthleteStatsForRender(stats) {
  const locations = Object.keys(stats.locations).reduce((acc, loc) => {
    if (!_isEmpty(acc[loc])) {
      acc[loc] = transformLocationsForRender(stats.locations[loc]);
    }
    return acc;
  }, {});
  return {
    ...stats,
    locations,
  };
}

module.exports = {
  transformByYear,
  transformByMonth,
  transformLocationsForRender,
  transformAthleteStatsForRender,
};
