const Activity = require('../../../schema/Activity');
const { defaultLocation } = require('../../../config');
const { getDefaultV2Stats } = require('./athleteStats');
const { getDefaultLocationStats } = require('./generateStatsV2');

/**
 * Count number of activities in database for an athlete
 * with default location, i.e 'prospectpark'
 *
 * @param {Number} athlete_id
 * @returns {Number}
 */
async function getNumActivities(athlete_id) {
  const activities = await Activity.find(
    { athlete_id },
    null,
    { lean: true },
  );

  if (!activities || !activities.length) {
    return 0;
  }

  // Filter activities where location is not set
  // or is set to default location, i.e 'prospectpark'
  const filteredActivities = activities.filter(
    ({ location = defaultLocation }) => location === defaultLocation,
  );
  return filteredActivities.length;
}
/**
 * Transform v1 athlete.stats to v2 athlete.stats
 * Assumes v1 stats refer only to Prospect Park
 *
 * @param {Object} v1Stats V1 stats
 * @param {Number} athlete_id
 * @returns {Object} V2 stats
 */
async function transformStats(v1Stats, athleteId = false) {
  const availableYears = [];
  const byYear = {};
  const byMonth = {};

  Object.keys(v1Stats).forEach((key) => {
    if (key === 'allTime' || key === 'single') {
      return;
    }
    const value = v1Stats[key];

    // Skip _YYYY keys and build from _YYYY_MM keys
    const parsed = /^_(\d{4})_(\d{2})$/.exec(key);
    if (!parsed) {
      return;
    }
    const year = parsed[1];
    const month = parsed[2];

    if (availableYears.indexOf(year) === -1) {
      availableYears.push(year);
    }

    byYear[year] = byYear[year] || 0;
    byYear[year] += value;

    byMonth[year] = byMonth[year] || Array(12).fill(0);
    const monthIdx = Number(month) - 1;
    byMonth[year][monthIdx] = value;
  });

  let numActivities = 0;
  if (athleteId) {
    numActivities = await getNumActivities(athleteId);
  }

  const locStats = getDefaultLocationStats({
    allTime: v1Stats.allTime,
    single: v1Stats.single,
    numActivities,
    availableYears,
    byYear,
    byMonth,
  });

  const locations = {
    [defaultLocation]: locStats,
  };

  const v2Stats = getDefaultV2Stats({
    availableYears,
    locations,
  });

  return v2Stats;
}

module.exports = {
  transformStats,
};
