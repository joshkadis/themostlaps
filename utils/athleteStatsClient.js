const { timePartString } = require('./dateTimeUtils');
const { defaultLocation } = require('../config');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_OUTPUT = {
  allTime: 0,
  single: 0,
  years: [],
  data: {},
};

const DEFAULT_OUTPUT_V2 = {
  allTime: 0,
  single: 0,
  byYear: {},
  byMonth: {},
  availableYears: [],
};

function parseRawAthleteStats(rawStats = {}) {
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
      byYear = [...byYear, [year, value]];
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
 * Format athlete stats for rider page
 *
 * @param {Object} stats
 * @return {Object}
 */
function statsForAthletePage(stats = {}) {
  let output = {};

  // Something would be fishy in this case,
  // so exit early
  if (typeof stats.allTime === 'undefined'
    || typeof stats.single === 'undefined'
  ) {
    return DEFAULT_OUTPUT;
  }

  const { allTime, single } = stats;
  output = Object.assign(DEFAULT_OUTPUT, { allTime, single });

  // Add years and months to output
  const data = Object.keys(stats).reduce((acc, key) => {
    // key will be like _2017 or _2017_03
    const matches = /^_(\d{4,4})_?(\d{2,2})?$/.exec(key);
    if (!matches) {
      return acc;
    }

    const year = matches[1];
    const month = matches.length >= 3 ? matches[2] : false;

    acc[year] = Object.assign(
      (acc[year] || {}),
      { [month || 'total']: stats[key] },
    );

    return acc;
  }, {});

  // Ascending order
  const years = Object.keys(data).sort();

  return Object.assign(output, {
    years,
    data,
  });
}

/**
 * Get rider's stats for a location
 *
 * @param {Object} stats
 * @param {String} location
 * @return {Object}
 */
function getStatsForLocation(stats = {}, location = defaultLocation) {
  return stats.locations && stats.locations[location]
    ? statsForAthletePage(stats.locations[location])
    : DEFAULT_OUTPUT;
}

/**
 * Get min and max years from array of years
 *
 * @param {Array} years Can be strings or numbers
 * @return {Object} Returns min and max as numbers
 */
function getMinMaxYears(years) {
  // Sort years
  const sorted = [...years]
    .map((year) => year.toString())
    .sort();
  const yearsInts = sorted.map((year) => parseInt(year, 10));
  const min = yearsInts.shift();
  const max = yearsInts.length > 0 ? yearsInts.pop() : min;
  return { min, max };
}

/**
 * Transform rider page stats object for single athlete years chart
 * including any missing years
 *
 * @param {Object} data
 * @return {Array}
 */
function statsForSingleAthleteChart(data) {
  const output = [];
  const { min, max } = getMinMaxYears(Object.keys(data));

  for (let year = min; year <= max; year += 1) {
    output.push({
      year,
      value: data[year] ? data[year].total : 0,
    });
  }

  return output;
}

/**
 * Format stats for a specific year chart for a single athlete
 *
 * @param {String} year
 * @param {Object} data
 * @return {Array}
 */
function statsForSingleAthleteYearChart(year, data) {
  if (!data[year]) {
    return [];
  }

  return MONTHS.map((month, idx) => ({
    month,
    value: data[year][timePartString(1 + idx)] || 0,
  }));
}

/**
 * Find value in chart data from adjacent key
 *
 * @param {Array} data
 * @param {String} key
 * @param {Number|String} value
 * @return {Number} Return 0 if year not found
 */
function findValue(data, key, value) {
  for (let idx = 0; idx < data.length; idx += 1) {
    if (value === data[idx][key]) {
      return data[idx].value;
    }
  }
  return 0;
}

/**
 * Merge stats for AllYears chart
 *
 * @param {Array} primary Main athlete
 * @param {Array} secondary Athlete for comparison
 * @return {Array}
 */
function mergeStats(primary, secondary) {
  const { min, max } = getMinMaxYears([].concat(
    primary.map(({ year }) => year),
    secondary.map(({ year }) => year),
  ));

  let output = [];
  for (let year = min; year <= max; year += 1) {
    output = output.concat({
      year,
      primary: findValue(primary, 'year', year),
      secondary: findValue(secondary, 'year', year),
    });
  }
  return output;
}

/**
 * Merge stats for SingleYear chart
 *
 * @param {Array} primary Main athlete
 * @param {Array} secondary Athlete for comparison
 * @return {Array}
 */
function mergeStatsSingleYear(primary, secondary) {
  return MONTHS.map((month) => ({
    month,
    primary: findValue(primary, 'month', month),
    secondary: findValue(secondary, 'month', month),
  }));
}

module.exports = {
  mergeStats,
  mergeStatsSingleYear,
  getMinMaxYears,
  getStatsForLocation,
  parseRawAthleteStats,
  statsForAthletePage,
  statsForSingleAthleteChart,
  statsForSingleAthleteYearChart,
};
