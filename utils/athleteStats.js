const Athlete = require('../schema/Athlete');

/**
 * Compile stats for an array of activity documents
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
    // Increment allTime total
    acc.allTime = acc.allTime + activity.get('laps');

    // Increment year and month allTimes
    const matches = /^(\d{4,4})-(\d{2,2})-/.exec(activity.get('start_date_local'));
    if (matches) {
      const yearKey = `_${matches[1]}`;
      const monthKey = `${yearKey}_${matches[2]}`;
      acc[yearKey] = (acc[yearKey] || 0) + activity.get('laps');
      acc[monthKey] = (acc[monthKey] || 0) + activity.get('laps');
    }

    // Most laps in a single ride?
    if (activity.get('laps') > acc.single) {
      acc.single = activity.get('laps');
    }

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
