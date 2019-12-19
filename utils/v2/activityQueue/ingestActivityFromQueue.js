const Activity = require('../../../schema/Activity');
const {
  activityCouldHaveLaps,
  getActivityData,
} = require('../../refreshAthlete/utils');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../../athleteStats');
const { slackError } = require('../../slackNotification');
const { getEpochSecondsFromDateObj } = require('../../athleteUtils');

/**
 * Update athlete's last refreshed to match UTC datetime string
 *
 * @param {Document} athleteDoc
 * @param {String} dateTimeStr ISO-8601 string, presumably UTC
 * @return {Document} Updated document
 */
async function updateAthleteLastRefreshed(athleteDoc, dateTimeStr) {
  const startDate = new Date(dateTimeStr); // UTC
  const result = await athleteDoc.updateOne({
    last_refreshed: getEpochSecondsFromDateObj(startDate),
  });
  return result && result.nModified;
}

/**
 * Validate activity model and save to database
 *
 * @param {Object} activityData Formatted data to create Activity
 * @param {Bool} isDryRun If true, will validate without saving
 * @return {Document|false} Saved document or false if error
 */
async function createActivityDocument(activityData, isDryRun = false) {
  const activityDoc = new Activity(activityData);
  // Mongoose returns error here instead of throwing
  const invalid = activityDoc.validateSync();
  if (invalid) {
    console.warn(`Failed to validate activity ${activityDoc.id}`);
    return false;
  }

  if (isDryRun) {
    return activityDoc;
  }

  try {
    await activityDoc.save();
    console.log(`Saved activity ${activityDoc.id}`);
    return activityDoc;
  } catch (err) {
    console.log(`Error saving activity ${activityDoc.id}`);
    console.log(err);
    return false;
  }
}

/**
 * Ingest an activity after fetching it
 * Refactored from utils/refresAthlete/refreshAthleteFromActivity.js for v2
 *
 * @param {Object} activityData JSON object from Strava API
 * @param {Athlete} athleteDoc
 * @param {Bool} isDryRun If true, no DB updates
 * @return {Bool} True if activity was ineligible or ingested. Only false if error.
 */
async function ingestActivityFromQueue(
  rawActivity,
  athleteDoc,
  isDryRun = false,
) {
  // Check eligibility
  if (!activityCouldHaveLaps(rawActivity, true)) {
    return true;
  }

  // Check for laps
  const activityData = getActivityData(rawActivity);
  if (!activityData.laps) {
    // Activity was processed but has no laps
    return true;
  }

  // Bye for now
  if (isDryRun) {
    return true;
  }

  /*
    Start doing stuff that updates DB
  */

  const savedDoc = await createActivityDocument(activityData);
  if (!savedDoc) {
    return false;
  }

  // Get updated stats
  const updatedStats = await compileStatsForActivities(
    [savedDoc],
    athleteDoc.toJSON().stats,
  );
  console.log(`Added ${updatedStats.allTime - athleteDoc.get('stats.allTime')} to stats.allTime`);

  // Update Athlete's stats
  try {
    await updateAthleteStats(athleteDoc, updatedStats);
  } catch (err) {
    console.log(`Error with updateAthleteStats() for ${athleteDoc.id} after activity ${rawActivity.id}`);
    slackError(90, {
      function: 'updateAthleteStats',
      athleteId: athleteDoc.id,
      activityId: rawActivity.id,
    });
    return false; // Should retry
  }

  try {
    const updated = await updateAthleteLastRefreshed(
      athleteDoc,
      rawActivity.start_date,
    );
    return !!updated;
  } catch (err) {
    console.log(`Error with updateAthleteLastRefreshed() for ${athleteDoc.id} after activity ${rawActivity.id}`);
    slackError(1, {
      function: 'updateAthleteLastRefreshed',
      athleteId: athleteDoc.id,
      activityId: rawActivity.id,
    });
    return false;
  }
}

module.exports = { ingestActivityFromQueue };
