const Athlete = require('../schema/Athlete');
const { compileSpecialStats } = require('./stats/compileSpecialStats');

/**
 * Update athlete stats from array of new activity documents
 *
 * @param {Array} activities Array of Activity documents
 * @param {Object} initial Optional initial stats value
 * @return {Object}
 */
function compileStatsForActivities(
  activities,
  initial = {
    allTime: 0,
    single: 0,
  },
) {
  if (!activities || !activities.length) {
    return initial;
  }

  return activities.reduce((acc, activity) => {
    const activityLaps = activity.get('laps');
    const startDate = activity.get('start_date_local');

    // Increment allTime total
    acc.allTime = acc.allTime + activityLaps;

    // Increment year and month allTimes
    const matches = /^(\d{4,4})-(\d{2,2})-/.exec(startDate);
    if (matches) {
      const yearKey = `_${matches[1]}`;
      const monthKey = `${yearKey}_${matches[2]}`;
      acc[yearKey] = (acc[yearKey] || 0) + activityLaps;
      acc[monthKey] = (acc[monthKey] || 0) + activityLaps;
    }

    // Most laps in a single ride?
    if (activityLaps > acc.single) {
      acc.single = activityLaps;
    }

    acc.special = compileSpecialStats(activityLaps, startDate, acc.special || {});

    return acc;
  }, initial);
}

/**
 * Update an athletes stats with new rides
 *
 * @param {Document} athleteDoc
 * @param {Object} stats
 * @param {String} status Defaults to 'ready'
 */
async function updateAthleteStats(athleteDoc, stats, status = 'ready') {
  const currentDate = new Date();
  return await Athlete.findByIdAndUpdate(
    athleteDoc.get('_id'),
    {
      last_updated: currentDate.toISOString(),
      stats,
      status,
    },
    { new: true }
  );
};

module.exports = {
  compileStatsForActivities,
  updateAthleteStats,
};
