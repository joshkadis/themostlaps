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
    last_updated: currentDate.toISOString(),
    created: currentDate.toISOString(),
    last_refreshed: getEpochSecondsFromDateObj(currentDate),
    access_token,
    token_type,
    athlete: {
      firstname,
      lastname,
      profile,
      email,
      id,
    },
  };
}

/**
 * Get epoch timestamp in seconds of athlete's last refresh (or creation)
 *
 * @param {Date} refreshDate Optional Date object, otherwise will use current date
 * @return {Number}
 */
function getEpochSecondsFromDateObj(refreshDate = false) {
  if (!refreshDate) {
    refreshDate = new Date();
  }

  return Math.floor(refreshDate.valueOf() / 1000);
}

async function createAthlete(athlete) {
  return await Athlete.create(getAthleteModelFormat(athlete));
};

module.exports = {
  createAthlete,
  getEpochSecondsFromDateObj,
};
