const Athlete = require('../schema/Athlete');

/**
 * Update an athletes stats with new rides
 *
 * @param {Document} athleteDoc
 * @param {Array} activities
 * @param {Document} activities[]
 * @param {Bool} rebuild
 */

module.exports = async (athleteDoc, activities, rebuild = false) => {
  const stats = athleteDoc.get('stats') || {};

  stats.totalLaps = (stats.totalLaps || 0) + activities.reduce((acc, activity) => {
    return acc + (activity.get('estimated_laps') || 0);
  }, 0);

  const updatedDoc = await Athlete.findByIdAndUpdate(
    athleteDoc.get('_id'),
    { stats },
    { overwrite: true }
  );
};
