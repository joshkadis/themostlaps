const _unset = require('lodash/unset');
const { defaultLocation } = require('../../../config');
const { getDefaultLocationStats } = require('./utils');
const Activity = require('../../../schema/Activity');
const { slackError } = require('../../slackNotification');

/**
 * Adds or remove single activity's data to stats for a given location
 *
 * @param {Object} activity Activity to add
 * @param {Object} location Existing stats for this location
 * @returns {Object} Updated stats
 */
function applyActivityToLocationStats(activity, locationStats) {
  const {
    laps,
    start_date_local,
    startDateUtc = false,
  } = activity;
  // Make sure we're even doing something here
  if (laps === 0) {
    return locationStats;
  }

  const absLaps = Math.abs(laps);
  const isRemovingLaps = laps < 0;

  // The difference between UTC and local only matters here
  // if someone was riding at night on the last day of the month.
  // So let's ignore it.
  const startDate = startDateUtc || new Date(start_date_local);
  const year = startDate.getFullYear();
  const monthIdx = startDate.getMonth();

  let {
    allTime = 0,
    single = 0,
    numActivities = 0,
  } = locationStats;

  // If removing laps, check that they're removable
  // without ending up with negative laps
  if (isRemovingLaps) {
    if (
      numActivities === 0
      || absLaps > allTime
      || absLaps > single
    ) {
      // @todo how to handle this?
      return locationStats;
    }
  }

  const {
    byYear = {},
    byMonth = {},
  } = locationStats;

  // Basic stuff...
  allTime += laps;
  if (laps > single) {
    single = laps;
  } else if (isRemovingLaps && absLaps === single) {
    // @todo Handle removing location's biggest single activity
    slackError(0, {
      msg: 'Deleted activity with highest single total',
      ...activity,
    });
    single = 0;
  }

  numActivities += isRemovingLaps ? -1 : 1;

  // Date-based stuff
  byYear[year] = byYear[year] || 0;
  byYear[year] += laps;
  if (byYear[year] <= 0) {
    // Don't go lower than 0 if removing laps
    _unset(byYear, year);
  }

  const availableYears = Object.keys(byYear)
    .map((yearKey) => Number.parseInt(yearKey, 10));

  // Remove monthly stats if this year has no more laps
  if (!byYear[year]) {
    _unset(byMonth, year);
  } else {
    // Decrement month but don't go below 0
    byMonth[year] = byMonth[year] || Array(12).fill(0);
    byMonth[year][monthIdx] += laps;
    if (byMonth[year][monthIdx] < 0) {
      byMonth[year][monthIdx] = 0;
    }
  }

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
    const thisLocation = applyActivityToLocationStats(
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

/**
 * Take a complete v2 stats object and update from a single Activity
 *
 * @param {Activity} activityDoc
 * @param {Object} allStats
 * @returns {Object} Updated stats object
 */
function updateAllStatsFromActivity(activityDoc, allStats) {
  const { locations } = allStats;
  const {
    start_date_local,
    startDateUtc,
    activityLocations,
  } = activityDoc;

  const updatedLocationsStats = activityLocations.reduce(
    (acc, { laps, location: locName }) => {
      acc[locName] = applyActivityToLocationStats(
        {
          laps,
          start_date_local,
          startDateUtc,
        },
        acc[locName] || {},
      );
      return acc;
    },
    locations,
  );

  return {
    ...allStats,
    locations: updatedLocationsStats,
  };
}

module.exports = {
  applyActivityToLocationStats,
  buildLocationsStatsFromActivities,
  getLocationsFromStats,
  generateLocationsStatsV2,
  updateAllStatsFromActivity,
};
