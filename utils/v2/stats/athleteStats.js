const _cloneDeep = require('lodash/cloneDeep');
const { defaultV2Stats } = require('../../../config/stats');
const { getMonthKey } = require('../../../utils/dateTimeUtils');

const getDefaultV2Stats = (overrides) => _cloneDeep({
  ...defaultV2Stats,
  ...overrides,
});

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
  getDefaultV2Stats,
  updateAthleteStatsFromActivity,
};
