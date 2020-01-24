const { getMonthName } = require('../../dateTimeUtils');
/**
 * Transform v2 byYear object for chart display
 *
 * @param {Object} map
 * @param {Array} Array of year:value pairs
 */
function transformByYear(map) {
  return Object.keys(map).reduce((acc, year) => {
    acc.push({
      year: Number(year),
      value: map[year],
    });
    return acc;
  }, []);
}

/**
 * Transform v2 byMonth object to map of month:value pairs
 *
 * @param {Object} data
 * @param {Array} Array of month:value pairs
 */
function transformByMonth(data) {
  return Object.keys(data).reduce((acc, year) => {
    acc[year] = data[year].map((value, monthIdx) => ({
      month: getMonthName(monthIdx + 1, 3),
      value,
    }));
    return acc;
  }, {});
}

/**
 * Transform a single location for frontend display
 *
 * @param {Object} location
 * @returns {Object}
 */
function transformLocationsForRender(locations) {
  return Object.keys(locations).reduce((acc, locName) => {
    const location = locations[locName];
    acc[locName] = {
      ...location,
      byYear: transformByYear(location.byYear),
      byMonth: transformByMonth(location.byMonth),
    };
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
    acc[loc] = transformLocationsForRender(stats.locations[loc]);
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
