const Athlete = require('../schema/Athlete');

/**
 * Convert API response for athlete to our model's format
 *
 * @param {Object} athlete
 * @param {String} athlete.access_token
 * @param {String} athlete.access_type
 * @param {Object} athlete.athlete
 * @return {Object}
 */
function getAthleteModelFormat({ athlete, access_token, token_type }) {
  const { firstname, lastname, profile, email, id } = athlete;
  const currentDate = new Date();
  return {
    _id: id,
    status: 'ingesting',
    last_updated: currentDate.toISOString(),
    created: currentDate.toISOString(),
    stats: {},
    access_token,
    token_type,
    athlete: {
      firstname,
      lastname,
      profile,
      email,
    },
  };
}

async function createAthlete(athlete) {
  return await Athlete.create(getAthleteModelFormat(athlete));
};

module.exports = {
  createAthlete,
};
