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
const { captureSentry } = require('../v2/services/sentry');

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
  const invalid = activityDoc.validateSync();
  if (invalid) {
    console.warn(`Failed to validate activity ${activity.get('_id')}`);
    return false;
  }

  if (!shouldUpdateDb) {
    return activityDoc;
  }

  await Activity.create(activityDoc);
  return activityDoc;
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
    captureSentry(
      err,
      'refreshAthleteFromActivity',
      { extra: { startDateString } },
    );
  }
  return athleteDoc;
}

/**
 * Take a single activity ID which may or may not have laps and refresh the athlete
 *
 * @param {Number} athleteId
 * @param {Number} activityId
 * @param {Bool} shouldUpdateDb If false, will validate without saving
 * @return {Bool} Process completed? (i.e. should it be retried)
 */
async function refreshAthleteFromActivity(
  athleteId,
  activityId,
  shouldUpdateDb = true,
) {
  // Handle int32 overflow
  // https://groups.google.com/forum/#!topic/strava-api/eVCHNjaTOSA
  if (activityId < 0) {
    // eslint-disable-next-line no-param-reassign
    activityId += 2 * (2147483647 + 1);
  }

  // Check that athlete exists and activity is new
  let athleteDoc = await Athlete.findById(athleteId);
  if (!athleteDoc) {
    console.log(`Athlete id ${athleteId} not found`);
    return true;
  }

  if (athleteDoc.get('status') === 'deauthorized') {
    console.log(`Athlete id ${athleteId} deauthorized the app`);
    return true;
  }

  const activityExists = await Activity.findById(activityId);
  if (activityExists) {
    console.log(`Activity id ${activityId} already exists in database`);
    return true;
  }

  // Fetch activity details
  const activity = await fetchActivity(activityId, athleteDoc);

  if (typeof activity === 'undefined' || !activity) {
    const toLog = typeof activity === 'undefined'
      ? 'response undefined'
      : activity;
    console.log(toLog);
    return false; // Should retry
  }

  if (!activity.segment_efforts || !activity.segment_efforts.length) {
    captureSentry(
      'Activity has no segment efforts',
      'refreshAthleteFromActivity',
      { extra: { athleteId, activityId } },
    );
    return false; // Strava still processing segment efforts, should retry
  }

  // Update athlete's last_refreshed timestamp
  if (shouldUpdateDb) {
    athleteDoc = await updateAthleteLastRefreshed(
      athleteDoc,
      activity.start_date,
    );
  }

  // Check eligibility
  if (!activityCouldHaveLaps(activity, true)) {
    return true;
  }

  // Check for laps
  const activityData = getActivityData(activity, true);
  if (!activityData.laps) {
    return true; // Activity was processed but has no laps
  }

  // Validate and save
  const savedDoc = await validateActivityAndSave(activityData, shouldUpdateDb);
  if (!savedDoc) {
    return false; // Might as well retry
  }

  // Update athlete stats
  const stats = await compileStatsForActivities(
    [savedDoc],
    athleteDoc.toJSON().stats,
  );
  console.log(`Added ${stats.allTime - athleteDoc.get('stats.allTime')} to stats.allTime`);

  // Update user stats and last_updated
  if (shouldUpdateDb) {
    try {
      await updateAthleteStats(athleteDoc, stats);
    } catch (err) {
      captureSentry(
        err,
        'refreshAthleteFromActivity',
        { extra: { athleteId, activityId } },
      );
      return false; // Should retry
    }
  }

  // Process succeeded!
  return true;
}

module.exports = refreshAthleteFromActivity;
