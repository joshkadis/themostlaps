require('isomorphic-fetch');
const { stringify } = require('query-string');
const Activity = require('../../schema/Activity');
const config = require('../../config');
const { getEpochSecondsFromDateObj } = require('../athleteUtils');
const { activityCouldHaveLaps } = require('./utils');
const { slackError } = require('../slackNotification');


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
  verbose = false
) {
  const queryParams = {
    after: afterTimestamp,
    page,
    per_page: config.apiPerPage,
  };

  const url = `${config.apiUrl}/athlete/activities?${stringify(queryParams)}`;

  if (verbose) {
    console.log(`Fetching ${url}`);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${athleteDoc.get('access_token')}`,
    },
  });

  if (200 !== response.status) {
    console.log(`Error ${response.status} fetching ${url} in fetchAthleteActivities`)
    await slackError(45, {
      athleteId: athleteDoc.get('_id'),
      url,
      status: response.status,
    });
    return allActivities;
  }

  const activities = await response.json();

  if (activities.length < config.apiPerPage) {
    return allActivities.concat(activities);
  }

  return await fetchAllAthleteActivities(
    athleteDoc,
    afterTimestamp,
    (page + 1),
    allActivities.concat(activities),
    verbose
  );
}

/**
 * Should activity be checked for laps? Must be longer than min distance and
 * starting or ending within allowed radius of park center
 *
 * @param {Int} id
 * @param {Bool} trainer
 * @param {Bool} manual
 * @param {Array} start_latlng
 * @param {Array} end_latlng
 * @param {Float} distance
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
  const activities = await fetchAllAthleteActivities(athleteDoc, afterTimestamp, 1, [], verbose);

  // Use for loop instead of Array.filter because of async
  const eligibleActivities = [];
  let newestActivityStartTimestamp = 0;
  for (let i = 0; i < activities.length; i++) {
    // Compare timestamp
    newestActivityStartTimestamp = compareTimestampToDateString(
      newestActivityStartTimestamp,
      activities[i].start_date
    );

    // Check if activity is eligible to maybe have laps
    const isEligible = await activityIsEligible(activities[i], verbose);
    if (isEligible) {
      eligibleActivities.push(activities[i]);
    }
  }

  // Update athlete doc with time to start next search
  if (0 < newestActivityStartTimestamp) {
    athleteDoc.set('last_refreshed', newestActivityStartTimestamp);
    try {
      const updatedAthleteDoc = await athleteDoc.save();
      if (verbose) {
        console.log(`Set athlete last_refreshed to ${updatedAthleteDoc.get('last_refreshed')}`);
      }
    } catch (err) {
      console.log(`Error updating last_refreshed for athlete ${updatedAthleteDoc.get('_id')}`);
    }
  }

  if (verbose) {
    console.log(`Activities: ${activities.length} total; ${eligibleActivities.length} eligible`);
  }

  return eligibleActivities.map(({ id }) => id);
}
