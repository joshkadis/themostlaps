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

/**
 * Check stats for all locations to see if rider
 * has ever ridden anywhere
 *
 * @param {Object} locations
 * @returns {Boolean}
 */
function riderHasLapsAnywhere(locations) {
  const locationNames = Object.keys(locations);
  let idx = 0;
  while (idx < locationNames.length) {
    const locationStats = locations[locationNames[idx]];
    if (locationStats.allTime) {
      return true;
    }
    idx += 1;
  }
  return false;
}

module.exports = {
  clearAthleteHistoryV2,
  getAthleteIdentifier,
  riderHasLapsAnywhere,
};
