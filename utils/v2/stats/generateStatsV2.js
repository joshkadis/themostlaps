const _cloneDeep = require('lodash/cloneDeep');
const { defaultLocation } = require('../../../config');
const Activity = require('../../../schema/Activity');
const { defaultLocationStats } = require('../../../config/stats');

const getDefaultLocationStats = (overrides) => _cloneDeep({
  ...defaultLocationStats,
  ...overrides,
});

/**
 * Adds single activity to stats for a given location
 *
 * @param {Object} activity Activity to add
 * @param {Object} location Existing stats for this location
 * @returns {Object} Updated stats
 */
function addActivityToLocationStats(activity, locationStats) {
  const {
    laps,
    start_date_local,
    startDateUtc = false,
  } = activity;

  // The difference between UTC and local only matters here
  // if someone was riding at night on the last day of the month.
  // So let's ignore it.
  const startDate = startDateUtc || new Date(start_date_local);
  const year = startDate.getFullYear();
  const monthIdx = startDate.getMonth();

  let {
    allTime,
    single,
    numActivities,
  } = locationStats;

  const {
    byYear,
    byMonth,
  } = locationStats;

  // Basic stuff...
  allTime += laps;
  if (laps > single) {
    single = laps;
  }
  numActivities += 1;

  // Date-based stuff
  byYear[year] = byYear[year] || 0;
  byYear[year] += laps;

  const availableYears = Object.keys(byYear);

  byMonth[year] = byMonth[year] || Array(12).fill(0);
  byMonth[year][monthIdx] += laps;

  return {
    allTime,
    single,
    numActivities,
    availableYears,
    byYear,
    byMonth,
  };
}

/**
 * Build stats.locations object from an array of activities data
 *
 * @param {Array} activities
 * @returns {Object}
 */
function buildLocationsStatsFromActivities(activities) {
  return activities.reduce((allLocations, activity) => {
    const {
      location = defaultLocation,
    } = activity;

    // Initialize stats for this activity's location
    const thisLocation = addActivityToLocationStats(
      activity,
      allLocations[location] || getDefaultLocationStats(),
    );

    return {
      ...allLocations,
      [location]: thisLocation,
    };
  }, {});
}

/**
 * Generate v2 stats from scratch with just an Athlete document
 *
 * @param {Athlete} athleteDoc
 * @param {Object} additionalStats Anything to merge into top-level stats at the end
 * @returns {Object}
 */
async function generateLocationsStatsV2(athleteDoc, additionalStats = {}) {
  const allActivities = await Activity
    .find({ athlete_id: athleteDoc._id })
    .lean();

  if (!allActivities.length) {
    // nothing to merge into so just return additional stats
    return additionalStats;
  }

  return {
    locations: buildLocationsStatsFromActivities(allActivities),
    ...additionalStats,
  };
}

/**
 * Get array of locations from a complete stats object
 *
 * @param {Object} stats.locations
 */
const getLocationsFromStats = ({ locations }) => Object.keys(locations);

module.exports = {
  getDefaultLocationStats,
  addActivityToLocationStats,
  buildLocationsStatsFromActivities,
  getLocationsFromStats,
  generateLocationsStatsV2,
};
