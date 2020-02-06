require('isomorphic-fetch');
const Activity = require('../../schema/Activity');
const config = require('../../config');
const { getEpochSecondsFromDateObj } = require('../athleteUtils');
const { activityCouldHaveLaps } = require('./utils');
const fetchStravaAPI = require('../fetchStravaAPI');
const { captureSentry } = require('../v2/services/sentry');

/**
 * Get all of a user's activities by iterating recursively over paginated API results
 *
 * @param {Document} athleteDoc
 * @param {Int} afterTimestamp
 * @param {Array} allActivities
 * @param {Boolean} verbose Defaults to false
 * @return {Promise}
 */
async function fetchAllAthleteActivities(
  athleteDoc,
  afterTimestamp,
  page = 1,
  allActivities = [],
  verbose = false,
) {
  const pathName = '/athlete/activities';
  if (verbose) {
    console.log(`Fetching ${pathName} for ${athleteDoc.get('_id')}`);
  }

  // @note Use new token refresh logic
  const activities = await fetchStravaAPI(
    pathName,
    athleteDoc,
    {
      after: afterTimestamp,
      page,
      per_page: config.apiPerPage,
    },
  );

  if (activities.status && activities.status !== 200) {
    captureSentry(
      'Failed fetching /athlete/activities in fetchAthleteActivities',
      'fetchAthleteActivities',
      {
        extra: { pathName, athleteId: athleteDoc.id },
      },
    );
    return allActivities;
  }

  if (activities.length < config.apiPerPage) {
    return allActivities.concat(activities);
  }

  return fetchAllAthleteActivities(
    athleteDoc,
    afterTimestamp,
    (page + 1),
    allActivities.concat(activities),
    verbose,
  );
}

/**
 * Should activity be checked for laps? Must be longer than min distance and
 * starting or ending within allowed radius of park center
 *
 * @param {Int} activity.id
 * @param {Bool} activity.trainer
 * @param {Bool} activity.manual
 * @param {Array} activity.start_latlng
 * @param {Array} activity.end_latlng
 * @param {Float} activity.distance
 * @param {Bool} verbose Defaults to false
 * @return {Bool}
 */
async function activityIsEligible(activity, verbose = false) {
  const { id = 0 } = activity;

  if (verbose) {
    console.log(`Checking activity ${id}`);
  }

  const exists = await Activity.findById(id);
  if (exists) {
    if (verbose) {
      console.log(`Activity ${id} is already in the database.`);
    }
    return false;
  }

  return activityCouldHaveLaps(activity, verbose);
}

/**
 * Compare timestamp to date string and return newer one as timestamp in *seconds*
 *
 * @param {Number} timestamp
 * @param {String} dateString ISO-8601 string
 * @return {Number}
 */
function compareTimestampToDateString(timestamp, dateString) {
  const compareDate = new Date(dateString);
  const compareTimestamp = getEpochSecondsFromDateObj(compareDate);
  return compareTimestamp > timestamp ? compareTimestamp : timestamp;
}

/**
 * Get list of athlete's activity IDs that *might* contain laps
 *
 * @param {Document} athleteDoc
 * @param {Int} afterTimestamp
 * @param {Boolean} verbose Defaults to false
 * @return {Array}
 */
module.exports = async (athleteDoc, afterTimestamp, verbose = false) => {
  const activities = await fetchAllAthleteActivities(
    athleteDoc,
    afterTimestamp,
    1,
    [],
    verbose,
  );

  // Use for loop instead of Array.filter because of async
  const eligibleActivities = [];
  let newestActivityStartTimestamp = 0;
  for (let i = 0; i < activities.length; i += 1) {
    // Compare timestamp
    newestActivityStartTimestamp = compareTimestampToDateString(
      newestActivityStartTimestamp,
      activities[i].start_date,
    );

    // Check if activity is eligible to maybe have laps
    // eslint-disable-next-line no-await-in-loop
    const isEligible = await activityIsEligible(activities[i], verbose);
    if (isEligible) {
      eligibleActivities.push(activities[i]);
    }
  }

  // Update athlete doc with time to start next search
  if (newestActivityStartTimestamp >= 0) {
    athleteDoc.set('last_refreshed', newestActivityStartTimestamp);
    try {
      const updatedAthleteDoc = await athleteDoc.save();
      if (verbose) {
        captureSentry(
          'Set athlete last_refreshed',
          'fetchAthleteActivities',
          {
            level: 'info',
            extra: {
              last_refreshed: updatedAthleteDoc.last_refreshed,
              athleteId: athleteDoc.id,
            },
          },
        );
      }
    } catch (err) {
      captureSentry(
        err,
        'fetchAthleteActivities',
        {
          extra: {
            athleteId: athleteDoc.id,
          },
        },
      );
    }
  }

  if (verbose) {
    console.log(`Activities: ${activities.length} total; ${eligibleActivities.length} eligible`);
  }

  return eligibleActivities.map(({ id }) => id);
};
