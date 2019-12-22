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
 * Create Activity document, validate, and save
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
 * @return {Object} Status and message to update QueueActivity document
 */
async function ingestActivityFromQueue(
  rawActivity,
  athleteDoc,
  isDryRun = false,
) {
  // Check eligibility
  if (!activityCouldHaveLaps(rawActivity, true)) {
    return {
      status: 'dequeued',
      detail: 'activityCouldHaveLaps() returned false',
    };
  }

  // Check for laps
  const activityData = getActivityData(rawActivity);
  if (!activityData.laps) {
    // Activity was processed but has no laps
    return {
      status: 'dequeued',
      detail: 'activity does not contain laps',
    };
  }

  /*
    Start doing stuff that updates DB
  */

  // Save to activities collection
  const activityDoc = await createActivityDocument(activityData, isDryRun);
  if (!activityDoc) {
    console.log('createActivityDocument() failed');
    return {
      status: 'error',
      errorMsg: 'createActivityDocument() failed',
    };
  }

  /*
    This is as far as we go with a dry run!
  */
  if (isDryRun) {
    return {
      status: 'dryrun',
      detail: `Dry run succeeded with ${activityData.laps} laps`,
    };
  }

  // Get updated stats
  // @todo refactor compileSpecialStats() so it doesn't always save the Activity document
  const updatedStats = await compileStatsForActivities(
    [activityDoc],
    athleteDoc.toJSON().stats,
  );
  console.log(`Added ${updatedStats.allTime - athleteDoc.get('stats.allTime')} to stats.allTime`);

  // @todo Combine updateAthleteStats and updateAthleteLastRefreshed as single db write operation
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
    return {
      status: 'error',
      errorMsg: 'updateAthleteStats() failed',
    };
  }

  // Update Athlete's last_refreshed time
  let success = true;
  try {
    // @todo Can this even return something falsy?
    const updated = await updateAthleteLastRefreshed(
      athleteDoc,
      rawActivity.start_date,
    );
    success = !!updated;
  } catch (err) {
    success = false;
  }

  if (!success) {
    console.log(`updateAthleteLastRefreshed() failed: athlete ${athleteDoc.id} | activity ${rawActivity.id}`);
    return {
      status: 'error',
      errorMsg: 'updateAthleteLastRefreshed() failed',
    };
  }

  /*
   Created a new Activity with laps
   Updated Athlete's stats and last_refreshed
   We made it!
  */
  return {
    status: 'ingested',
    detail: `${activityData.laps} laps`,
  };
}

module.exports = { ingestActivityFromQueue };
