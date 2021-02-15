const Activity = require('../schema/Activity');
const Athlete = require('../schema/Athlete');
const { testAthleteIds } = require('../config');
const { slackSuccess } = require('./slackNotification');
const { captureSentry } = require('./v2/services/sentry');

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
 * Get timestamp in seconds or ms from ISO date string
 * Assume dateStr specifies timezone offset if applicable
 *
 * @param {String} dateStr
 * @param {Object} opts
 * @param {String} opts.unit 'seconds' or 'ms'. Default to ms.
 * @return {Number|false} seconds or milliseconds or false if bad input
 */
function getTimestampFromString(dateStr, opts = {}) {
  const { unit = 'ms' } = opts;
  const date = new Date(dateStr);
  const value = date.valueOf();
  if (Number.isNaN(value)) {
    return false;
  }
  return unit === 'seconds'
    ? value / 1000
    : value;
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
      created_at: createdAt,
    } = athleteInfo.athlete;

    const currentDate = new Date();
    return {
      _id: id,
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
        createdAt,
      },
      preferences: {
        notifications: {
          monthly: shouldSubscribe,
        },
      },
    };
  } catch (err) {
    captureSentry(err, 'getAthleteModelFormat', { extra: athleteInfo });
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

/**
 * Permanently remove athlete profile and activities
 *
 * @param {Integer|Athlete} athlete Athlete ID or document
 * @param {Array} removableStatuses Statuses eligible for removal. May include 'any'. Defaults to ['deauthorized']
 */
async function removeAthlete(athlete, removableStatuses = ['deauthorized']) {
  let athleteDoc = false;
  if (athlete instanceof Athlete) {
    athleteDoc = athlete;
  } else if (typeof athlete === 'number') {
    athleteDoc = await Athlete.findById(athlete);
    if (!athleteDoc) {
      console.log(`removeAthlete() error: could not find Athlete from ${athlete}`);
      return;
    }
  } else {
    console.log(`removeAthlete() accepts Athlete or Number, received: ${JSON.stringify(athlete)}`);
  }

  const athleteId = athleteDoc._id;
  const athleteStatus = athleteDoc.get('status');

  // removableStatuses must include athlete's current status or 'any'
  if (
    removableStatuses.indexOf(athleteStatus) === -1
    && removableStatuses.indexOf('any') === -1
  ) {
    console.log(`removeAthlete() error: ${athleteId} status '${athleteStatus}' not in ${JSON.stringify(removableStatuses)}`);
    return;
  }

  try {
    const { deletedCount } = await Activity.deleteMany({
      athlete_id: athleteId,
    });
    console.log(`Deleted ${deletedCount} activities for athlete ${athleteId}`);

    await Athlete.deleteOne({ _id: athleteId });
    console.log(`Deleted user ${athleteId} from athletes collection`);

    slackSuccess(`Removed ${athleteId} from activities and athletes collections`);
  } catch (err) {
    captureSentry(err, 'removeAthlete', { extra: { athleteId } });
  }
}

module.exports = {
  getAthleteModelFormat,
  getTimestampFromString,
  createAthlete,
  deauthorizeAthlete,
  removeAthlete,
  getEpochSecondsFromDateObj,
  isTestUser,
};
