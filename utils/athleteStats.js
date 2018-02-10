const Athlete = require('../schema/Athlete');

/**
 * Compile stats for an array of activity documents
 *
 * @param {Array} activities
 * @return {Object}
 */
function compileStatsForActivities(activities) {
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
  }, {
    allTime: 0,
    single: 0,
  });
}

/**
 * Update an athletes stats with new rides
 *
 * @param {Document} athleteDoc
 * @param {Object} stats
 */

async function updateAthleteStats(athleteDoc, stats) {
  return await Athlete.findByIdAndUpdate(
    athleteDoc.get('_id'),
    { stats },
    { new: true }
  );
};

module.exports = {
  compileStatsForActivities,
  updateAthleteStats,
};
