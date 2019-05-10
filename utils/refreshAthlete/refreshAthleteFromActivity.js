const Athlete = require('../../schema/Athlete');
const Activity = require('../../schema/Activity');
const {
  fetchActivity,
  activityCouldHaveLaps,
  getActivityData,
} = require('./utils');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../athleteStats');
const {
  getEpochSecondsFromDateObj,
} = require('../athleteUtils');

/**
 * Validate activity model and save to database
 *
 * @param {Object} activity
 * @param {Bool} shouldUpdateDb If false, will validate without saving
 * @return {Document|false}
 */
async function validateActivityAndSave(activity, shouldUpdateDb = true) {
  const activityDoc = new Activity(activity);
  // Mongoose returns error here instead of throwing
  const err = activityDoc.validateSync();
  if (err) {
    console.warn(`Failed to validate activity ${activity.get('_id')}`);
    return false;
  }

  if (!shouldUpdateDb) {
    return activityDoc;
  }

  try {
    await Activity.create(activityDoc);
    console.log(`Saved activity ${activityDoc.get('_id')}`);
    return activityDoc;
  } catch (err) {
    console.log(`Error saving activity ${activityDoc.get('_id')}`);
    console.log(err);
    return false;
  }
}

/**
 * Update athlete's last refreshed to start time of this activity
 *
 * @param {Document} athleteDoc
 * @param {String} startDateString ISO-8601 string, presumably UTC
 * @return {Document} Updated document
 */
async function updateAthleteLastRefreshed(athleteDoc, startDateString) {
  try {
    const startDate = new Date(startDateString); // UTC
    athleteDoc.set('last_refreshed', getEpochSecondsFromDateObj(startDate));
    const updatedDoc = await athleteDoc.save();
    console.log(`Updated last_refreshed to ${startDateString}`);
    return updatedDoc;
  } catch (err) {
    console.log(`Error updating last_refreshed to ${startDateString}`);
  }
  return athleteDoc;
}

/**
 * Take a single activity ID which may or may not have laps and refresh the athlete
 *
 * @param {Number} athleteId
 * @param {Number} activityId
 * @param {Bool} shouldUpdateDb If false, will validate without saving
 */
async function refreshAthleteFromActivity(athleteId, activityId, shouldUpdateDb = true) {
  // Handle int32 overflow
  // https://groups.google.com/forum/#!topic/strava-api/eVCHNjaTOSA
  if (activityId < 0) {
    activityId += 2 * (2147483647 + 1)
  }

  // Check that athlete exists and activity is new
  let athleteDoc = await Athlete.findById(athleteId);
  if (!athleteDoc) {
    console.log(`Athlete id ${athleteId} not found`);
    return 0;
  }

  if (athleteDoc.get('status') === 'deauthorized') {
    console.log(`Athlete id ${athleteId} deauthorized the app`);
    return 0;
  }

  const activityExists = await Activity.findById(activityId);
  if (activityExists) {
    console.log(`Activity id ${activityId} already exists in database`);
    return 0;
  }

  // Fetch activity details
  const activity = await fetchActivity(activityId, athleteDoc);

  if (typeof activity === 'undefined' || !activity) {
    return 0;
  }

  // Update athlete's last_refreshed timestamp
  if (shouldUpdateDb) {
    athleteDoc = await updateAthleteLastRefreshed(athleteDoc, activity.start_date);
  }

  // Check eligibility
  if (!activityCouldHaveLaps(activity, true)) {
    return 0;
  }

  // Check for laps
  const activityData = getActivityData(activity, true);
  if (!activityData) {
    return 0;
  }

  // Validate and save
  const savedDoc = await validateActivityAndSave(activityData, shouldUpdateDb);
  if (!savedDoc) {
    return 0;
  }

  // Update athlete stats
  const stats = await compileStatsForActivities([savedDoc], athleteDoc.toJSON().stats);
  console.log(`Added ${stats.allTime - athleteDoc.get('stats.allTime')} to stats.allTime`);

  // Update user stats and last_updated
  if (shouldUpdateDb) {
    const updatedAthleteDoc = await updateAthleteStats(athleteDoc, stats);
  }

  // Return laps found
  // @todo Reconcile with ${stats.allTime - athleteDoc.get('stats.allTime')} above
  return activityData.laps;
}

module.exports = refreshAthleteFromActivity;
