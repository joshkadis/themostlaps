const Athlete = require('../schema/Athlete');

/**
 * Convert API response for ahlete to our model's format
 *
 * @param {Object} athlete
 * @param {String} athlete.access_token
 * @param {String} athlete.access_type
 * @param {Object} athlete.athlete
 * @return {Object}
 */
function getAthleteModelFormat(athlete) {
  const currentDate = new Date();
  return {
    _id: athlete.athlete.id,
    status: 'ingesting',
    last_updated: currentDate.toISOString(),
    created: currentDate.toISOString(),
    stats: {},
    ...athlete,
  };
}

async function createAthlete(athlete) {
  return await Athlete.create(getAthleteModelFormat(athlete));
};

async function updateAthleteStats(athlete, stats) {
  // @todo Update athlete model stats
}

module.exports = {
  createAthlete,
  updateAthleteStats,
};
