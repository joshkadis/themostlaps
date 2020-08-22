const _cloneDeep = require('lodash/cloneDeep');
const Activity = require('../../../schema/Activity');
const {
  activityCouldHaveLaps,
} = require('../../refreshAthlete/utils');
const { getTimestampFromString } = require('../../athleteUtils');
const { transformActivity } = require('../stats/transformActivity');
const { updateAllStatsFromActivity } = require('../stats/generateStatsV2');
const { slackSuccess } = require('../../slackNotification');
const captureSentry = require('../services/sentry');

const NOTIFY_ON_SUCCESS = true;

/**
 * Create Activity document, validate, and save
 *
 * @param {Object} activityData Formatted data to create Activity
 * @param {Bool} isDryRun If true, will validate without saving
 * @returns {Document|false} Saved document or false if error
 */
function createActivityDocument(activityData) {
  const activityDoc = new Activity(activityData);
  // Mongoose returns error here instead of throwing
  const invalid = activityDoc.validateSync();
  if (invalid) {
    console.warn(`Failed to validate activity ${activityDoc.id}`);
    return false;
  }

  return activityDoc;
}

/**
 * Ingest an activity with v2 data structure after fetching it
 * Refactored from utils/refresAthlete/refreshAthleteFromActivity.js for v2
 *
 * @param {Object} activityData JSON object from Strava API
 * @param {Athlete} athleteDoc
 * @param {Bool} isDryRun If true, no DB updates
 * @returns {Object} result
 * @returns {String} result.status Allowed status for QueueActivity document
 * @returns {String} result.detail Extra info for QueueActivity document
 */
async function ingestActivityFromStravaData(
  rawActivity,
  athleteDoc,
  isDryRun = false,
) {
  /*
    Note for dry runs from `$ activity queue ingest <activityId>` :
    Processing won't reach this point unless the QueueActivity has
    passed the "same number of segment efforts twice in a row" test
  */

  // Check eligibility
  if (!activityCouldHaveLaps(rawActivity, true)) {
    return {
      status: 'dequeued',
      detail: 'activityCouldHaveLaps() returned false during ingest',
    };
  }

  const activityData = await transformActivity(rawActivity, athleteDoc.isSubscriber);
  if (!activityData.laps) {
    // Activity was processed but has no laps
    return {
      status: 'dequeued',
      detail: 'activity does not contain laps',
    };
  }

  const activityDoc = createActivityDocument(activityData);
  if (!activityDoc) {
    console.log('createActivityDocument() failed');
    return {
      status: 'error',
      errorMsg: 'createActivityDocument() failed',
    };
  }
  if (!isDryRun) {
    await activityDoc.save();
  }

  // Get updated stats with something like:
  const updatedStats = updateAllStatsFromActivity(
    activityDoc,
    _cloneDeep(athleteDoc.stats),
  );
  const activityStartTimestamp = getTimestampFromString(
    rawActivity.start_date,
    { unit: 'seconds' },
  );
  athleteDoc.set({
    stats: updatedStats,
    last_refreshed: activityStartTimestamp,
  });
  athleteDoc.markModified('stats');
  if (!isDryRun) {
    await athleteDoc.save();
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

  // @todo return { status: 'error' } where needed!

  /*
   First we created a new Activity with laps
   Then we updated Athlete's stats and last_refreshed
   We made it!
  */

  if (NOTIFY_ON_SUCCESS) {
    // Going straight to prod with this so being cautious
    try {
      slackSuccess(
        `New activity ${activityDoc.id} for ${athleteDoc.id} (${athleteDoc.athlete.firstname} ${athleteDoc.athlete.lastname})`,
        {
          athlete: {
            allTime: athleteDoc.stats.locations[activityDoc.location].allTime,
            last_updated: athleteDoc.last_updated,
          },
          activity: {
            location: activityDoc.location,
            laps: activityDoc.laps,
            numSegmentEfforts: activityDoc.segment_efforts.length,
            locationsStats: activityDoc.activityLocations.map(
              ({ location, laps }) => `${location}: ${laps} lap(s)`,
            ),
          },
        },
      );
    } catch (err) {
      captureSentry(
        'slackSuccess failed',
        'ingestActivityFromStravaData',
        {
          athlete: athleteDoc._id,
          activity: activityDoc._id,
        },
      );
    }
  }

  return {
    status: 'ingested',
    detail: `${activityData.laps} laps`,
  };
}

module.exports = { ingestActivityFromStravaData };
