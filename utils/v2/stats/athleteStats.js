const { defaultLocation } = require('../../../config');

const DEFAULT_OUTPUT_V2 = {
  allTime: 0,
  single: 0,
  byYear: [],
  byMonth: [],
  availableYears: [],
};

/**
 * Transform stats from format in database to format for rider page
 *
 * @param {Object} rawStats
 * @return {Object}
 */
function transformAthleteStats(rawStats = {}) {
  // If either of these is undefined or 0, we can exit
  if (!rawStats.allTime || !rawStats.single) {
    return DEFAULT_OUTPUT_V2;
  }

  const parsed = { ...DEFAULT_OUTPUT_V2 };
  let byYear = [];
  let byMonth = [];
  let availableYears = [];

  const keys = Object.keys(rawStats);
  // Keys will be like _2018, _2018_01
  // This sorts them by year and months within a year
  keys.sort();
  keys.forEach((key) => {
    const value = rawStats[key];
    if (key === 'allTime' || key === 'single') {
      parsed[key] = value;
      return;
    }

    const matches = /^_(\d{4,4})_?(\d{2,2})?$/.exec(key);
    if (!matches) {
      return;
    }

    const year = parseInt(matches[1], 10);
    const month = matches[2]
      ? parseInt(matches[2], 10)
      : false;

    if (month === false) {
      byYear = [...byYear, { value, year }];
      availableYears = [...availableYears, year];
    } else {
      byMonth = [...byMonth, [year, month, value]];
    }
  });

  return {
    ...parsed,
    availableYears,
    byMonth,
    byYear,
  };
}

/**
 * Get rider's stats for a location
 *
 * @param {Object} stats
 * @param {String} location
 * @return {Object|Bool} Transformed stats of false if location not found
 */
function getStatsForLocation(locationsObj, location = defaultLocation) {
  return locationsObj && locationsObj[location]
    ? transformAthleteStats(locationsObj[location])
    : false;
}

module.exports = {
  getStatsForLocation,
  transformAthleteStats,
};
