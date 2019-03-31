const Athlete = require('../schema/Athlete');
const mongoose = require('mongoose');
const { testAthleteIds } = require('../config');
const { slackError } = require('./slackNotification');

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
    const { firstname, lastname, profile, id } = athleteInfo.athlete;

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

/**
  Get Athlete document from token string or just return a Document

  @param {String|Document} tokenOrDoc
  @returns {Document|null} Will return document or null if received nonexistent token string
**/
async function getDocFromMaybeToken(tokenOrDoc) {
  try {
    if (typeof tokenOrDoc !== 'string') {
      // not a string
      if (tokenOrDoc instanceof mongoose.Document) {
        // is a mongoose document
        return tokenOrDoc;
      }
      // neither a string nor a mongoose document
      return null;
    } else {
      // is a string
      athleteDoc = await Athlete.findOne({ access_token: tokenOrDoc });
      return athleteDoc || null;
    }
  } catch (err) {
    return null;
  }
}

module.exports = {
  getAthleteModelFormat,
  createAthlete,
  getEpochSecondsFromDateObj,
  isTestUser,
  getDocFromMaybeToken,
};
