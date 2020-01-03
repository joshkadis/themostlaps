const { defaultLocation } = require('../../../config');
const { getMonthName, getMonthKey } = require('../../../utils/dateTimeUtils');

const DEFAULT_OUTPUT_V2 = {
  allTime: 0,
  single: 0,
  byYear: [],
  byMonth: {},
  availableYears: [],
};

/**
 * Create array of month-value objects to receive monthly stats
 *
 * @return {Array}
 */
function setUpYearByMonths() {
  return Array(12)
    .fill(null)
    .map((val, idx) => ({
      month: getMonthName(idx + 1, 3), // Jan, Feb, Mar...
      value: 0,
    }));
}

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

  // Ready to override default properties
  const namedStats = { ...DEFAULT_OUTPUT_V2 };
  let byYear = [];
  const byMonth = {};
  let availableYears = [];

  const keys = Object.keys(rawStats);
  // Keys will be like _2018, _2018_01
  // So this sorts them by year and months within a year
  keys.sort();
  keys.forEach((key) => {
    const value = rawStats[key];
    if (key === 'allTime' || key === 'single') {
      namedStats[key] = value;
      return;
    }

    // Only match _YYYY and _YYYY_MM
    const matches = /^_(\d{4})(?:_(\d{2}))?$/.exec(key);
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
    } else if (month <= 12) {
      byMonth[year] = byMonth[year] || setUpYearByMonths();
      // Set value for 1-based month as 0-based index
      byMonth[year][(month - 1)].value = value;
    }
  });

  return {
    ...namedStats,
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
 * @return {Object|Bool} Transformed stats or false if location not found
 */
function getStatsForLocation(locationsObj, location = defaultLocation) {
  return locationsObj && locationsObj[location]
    ? transformAthleteStats(locationsObj[location])
    : false;
}

/**
 * Set updated athlete v1 stats object from single activity
 * Note: will not recalculate stats.single (biggest all-time ride)
 *
 * @param {Athlete} athleteDoc
 * @param {Number} delta May be positive or negative
 * @param {String} startDate ISO date string
 */
function updateAthleteStatsFromActivity(athleteDoc, delta, startDate) {
  const { stats } = athleteDoc;
  const activityDate = new Date(startDate);
  const yearKey = `_${activityDate.getFullYear()}`;
  const monthKey = getMonthKey(activityDate);

  stats.allTime += delta;
  if (stats[yearKey]) {
    stats[yearKey] += delta;
  }
  if (stats[monthKey]) {
    stats[monthKey] += delta;
  }

  athleteDoc.set({ stats });
  athleteDoc.markModified('stats');
}

module.exports = {
  updateAthleteStatsFromActivity,
  getStatsForLocation,
  transformAthleteStats,
};
