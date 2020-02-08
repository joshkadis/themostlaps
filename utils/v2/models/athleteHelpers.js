const Activity = require('../../../schema/Activity');
const { getDefaultV2Stats } = require('../stats/utils');

/**
 * Get athlete name and id as string for logging
 *
 * @param Athlete athleteDoc
 */
function getAthleteIdentifier(athleteDoc) {
  const {
    athlete: {
      firstname,
      lastname,
    },
    _id,
  } = athleteDoc.toJSON();
  return `${firstname} ${lastname} | ${_id}`;
}

/**
 * Clear activities and stats for athlete document
 *
 * @param {Athlete} athleteDoc
 * @param {Object} activitiesQuery Optional query for activities to remove
 */
async function clearAthleteHistoryV2(athleteDoc, activitiesQuery = {}) {
  console.log(`Clearing activities and stats for ${athleteDoc.id}`);
  if (
    activitiesQuery.athlete_id
    && activitiesQuery.athlete_id.toString() !== athleteDoc._id.toString()
  ) {
    throw new Error(`clearAthleteHistoryV2 for ${athleteDoc.id} with ${JSON.stringify(activitiesQuery)}`);
  }

  const {
    deletedCount,
  } = await Activity.remove({
    ...activitiesQuery,
    athlete_id: athleteDoc._id,
  });
  console.log(`Removed ${deletedCount} activities`);

  athleteDoc.set({
    stats: getDefaultV2Stats(),
    stats_version: 'v2',
  });
  athleteDoc.markModified('stats');
  await athleteDoc.save();
  console.log('Reset athlete stats');
}

module.exports = {
  clearAthleteHistoryV2,
  getAthleteIdentifier,
};
