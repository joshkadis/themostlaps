const Athlete = require('../schema/Athlete');
const { testAthleteIds } = require('../config');
const { slackError } = require('./slackNotification');

/**
 * Get epoch timestamp in seconds of athlete's last refresh (or creation)
 *
 * @param {Date} refreshDate Optional Date object, otherwise will use current date
 * @return {Number}
 */
function getEpochSecondsFromDateObj(refreshDate = false) {
  const useDate = refreshDate || new Date();

  return Math.floor(useDate.valueOf() / 1000);
}

/**
 * Convert API response for athlete to our model's format
 * @note Use new token refresh logic
 * @param {Object} athlete
 * @param {String} athlete.access_token
 * @param {Object} athlete.athlete
 * @param {Bool} shouldSubscribe
 * @return {Object|false}
 */
function getAthleteModelFormat(athleteInfo, shouldSubscribe = true) {
  try {
    const { access_token, token_type } = athleteInfo; // @note Removed email after Strava API change, Jan 15
    const refresh_token = athleteInfo.refresh_token || '';
    const expires_at = athleteInfo.expires_at || 0;

    // @note Removed email from model format due to Strava API change
    const {
      firstname,
      lastname,
      profile,
      id,
    } = athleteInfo.athlete;

    const currentDate = new Date();
    return {
      _id: id,
      last_updated: currentDate.toISOString(),
      created: currentDate.toISOString(),
      last_refreshed: getEpochSecondsFromDateObj(currentDate),
      access_token,
      token_type,
      refresh_token,
      expires_at,
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
  } catch (err) {
    slackError(0, Object.assign(athleteInfo, { message: err.message || 'unknown' }));
    return false;
  }
}

async function createAthlete(athlete) {
  return Athlete.create(getAthleteModelFormat(athlete));
}


/**
 * Determine if athlete is a test user
 *
 * @param {Number|Document} athlete ID or Athlete document
 * @return {Bool}
 */
function isTestUser(athlete) {
  if (athlete instanceof Athlete) {
    return testAthleteIds.indexOf(athlete.get('_id')) !== -1;
  }

  if (typeof athlete === 'number') {
    return testAthleteIds.indexOf(athlete) !== -1;
  }

  return false;
}

/**
 * Set athlete status to 'deauthorized'
 *
 * @param {Integer|Athlete} athlete Athlete ID or document
 */
async function deauthorizeAthlete(athlete) {
  let athleteDoc = false;
  if (athlete instanceof Athlete) {
    athleteDoc = athlete;
  } else {
    athleteDoc = await Athlete.findById(athlete);
  }

  if (!athleteDoc) {
    return;
  }

  await athleteDoc.updateOne({ status: 'deauthorized' });
}

module.exports = {
  getAthleteModelFormat,
  createAthlete,
  deauthorizeAthlete,
  getEpochSecondsFromDateObj,
  isTestUser,
};
