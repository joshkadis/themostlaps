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
 */
async function clearAthleteHistoryV2(athleteDoc) {
  console.log('Clearing activities and stats');
  const {
    deletedCount,
  } = await Activity.remove({ athlete_id: athleteDoc._id });
  console.log(`Removed ${deletedCount} activities`);

  athleteDoc.set({
    locations: [],
    stats: getDefaultV2Stats(),
    stats_version: 'v2',
  });
  athleteDoc.markModified('locations');
  athleteDoc.markModified('stats');
  await athleteDoc.save();
  console.log('Reset athlete stats');
}

module.exports = {
  clearAthleteHistoryV2,
  getAthleteIdentifier,
};
