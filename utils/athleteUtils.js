const Athlete = require('../schema/Athlete');
const { testAthleteIds } = require('../config');

/**
 * Convert API response for athlete to our model's format
 *
 * @param {Object} athlete
 * @param {String} athlete.access_token
 * @param {String} athlete.access_type
 * @param {Object} athlete.athlete
 * @param {Bool} shouldSubscribe
 * @return {Object}
 */
function getAthleteModelFormat({ athlete, access_token, token_type }, shouldSubscribe = true) {
  // @note Removed email after Strava API change, Jan 15
  const { firstname, lastname, profile, id } = athlete;
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
      id,
    },
    preferences: {
      notifications: {
        monthly: shouldSubscribe,
      },
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


/**
 * Determine if athlete is a test user
 *
 * @param {Number|Document} athlete ID or Athlete document
 * @return {Bool}
 */
function isTestUser(athlete) {
  if (athlete instanceof Athlete) {
    return -1 !== testAthleteIds.indexOf(athlete.get('_id'));
  }

  if ('number' === typeof athlete) {
    return -1 !== testAthleteIds.indexOf(athlete);
  }

  return false;
}

module.exports = {
  getAthleteModelFormat,
  createAthlete,
  getEpochSecondsFromDateObj,
  isTestUser,
};
