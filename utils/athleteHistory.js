require('isomorphic-fetch');
const querystring = require('querystring');
const { apiUrl, lapSegmentId, addMakeupLap } = require('../config');
const Activity = require('../schema/Activity');
const Athlete = require('../schema/Athlete');
const { slackError } = require('./slackNotification');
const fetchStravaAPI = require('./fetchStravaAPI');

/**
 * Get complete history of athlete's efforts for canonical segment
 * @param {Document} athleteDoc
 * @param {Number} page
 * @param {Array} allEfforts
 * @return {Array}
 */
async function getLapEffortsHistory(athleteDoc, page = 1, allEfforts = []) {
  const athleteId = athleteDoc.get('_id');

  const efforts  = await fetchStravaAPI(
    `/segments/${lapSegmentId}/all_efforts`,
    athleteDoc,
    {
      athlete_id: athleteId,
      per_page: 200,
      page,
    }
  );

  if (efforts.status && 200 !== efforts.status) {
    console.log(`Error getLapEffortsHistory: ${athleteId}`);
    slackError(45, {
      athleteId,
      path: `/segments/${lapSegmentId}/all_efforts`,
      page,
    });
    return allEfforts;
  }

  if (!efforts.length) {
    return allEfforts;
  }

  return await getLapEffortsHistory(
    athleteDoc,
    (page + 1),
    allEfforts.concat(efforts)
  );
}

/**
 * Format segment effort into our database model shape
 *
 * @param {Object} effort Segment effort from Strava API
 * @return {Object}
 */
function formatSegmentEffort({ id, elapsed_time, moving_time, start_date_local }) {
  return {
    _id: id,
    elapsed_time,
    moving_time,
    start_date_local,
  };
}

/**
 * Convert big array of segment efforts into array of inferred activities
 *
 * @param {Array} efforts
 * @param {String} source Optional. Defaults to 'signup'
 * @return {Array}
 */
function getActivitiesFromEfforts(efforts, source = 'signup') {
  const activitiesMap = efforts.reduce((map, effort) => {
    const {
      activity,
      athlete,
      start_date_local,
    } = effort;

    // Add activity to map if not found
    if (!map[activity.id]) {
      const added = new Date();
      map[activity.id] = {
        _id: activity.id,
        added_date: added.toISOString(),
        athlete_id: athlete.id,
        laps: addMakeupLap ? 1 : 0,
        segment_efforts: [],
        source,
        start_date_local,
      };
    }

    // Increment laps for activity
    map[activity.id].laps = map[activity.id].laps + 1;

    // save segment effort for v2+ features
    map[activity.id].segment_efforts.push(formatSegmentEffort(effort));

    return map;
  }, {});
  return Object.values(activitiesMap);
}

/**
 * Compiled athlete history on initial signup based on segment efforts for canonical lap segment
 *
 * @param {Document} athlete
 * @return {Array} List of activities for athlete
 */
async function fetchAthleteHistory(athlete) {
  const lapEfforts = await getLapEffortsHistory(athlete);

  if (!lapEfforts || !lapEfforts.length) {
    return [];
  }

  return getActivitiesFromEfforts(lapEfforts);
}

/**
 * Should only create new Activity if it passes validation and
 * has not already been saved in the database
 *
 * @param {Object} activity
 * @return {Bool}
 */
async function shouldCreateActivity(activity) {
  const activityModel = new Activity(activity);
  const err = activityModel.validateSync();
  if (err) {
    console.warn(`Failed to validate activity ${activity._id}`);
    console.log(activity);
    return false;
  }

  const foundActivity = await Activity.findById(activity._id);
  if (foundActivity) {
    console.log(`Already saved activity ${activity._id}`);
    return false;
  }

  return true;
}

/**
 * Validate and save activities history
 *
 * @param {Array}
 * @param {Array}
 */
async function saveAthleteHistory(activities) {
  // Filter out invalid or already saved activities
  const filteredActivities = [];
  for (let i = 0; i < activities.length; i++) {
    const shouldCreate = await shouldCreateActivity(activities[i]);
    if (shouldCreate) {
      filteredActivities.push(activities[i]);
    }
  }

  return await Activity.create(filteredActivities);
}

module.exports = {
  fetchAthleteHistory,
  saveAthleteHistory,
  formatSegmentEffort,
};
