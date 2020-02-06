const Athlete = require('../../schema/Athlete');
const Activity = require('../../schema/Activity');
const fetchAthleteActivities = require('./fetchAthleteActivities');
const fetchLapsFromActivities = require('./fetchLapsFromActivities');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../athleteStats');
const { getEpochSecondsFromDateObj } = require('../athleteUtils');

/**
 * Get timestamp of athlete's most recently checked activity from last_refreshed
 * or fall back to athlete document's created date
 *
 * @param {Document} athleteDoc
 * @return {Number} UTC *seconds*
 */
async function getFetchTimestampFromAthlete(athleteDoc) {
  let lastRefreshed = athleteDoc.get('last_refreshed');

  // Set athlete's last_refreshed to created time if needed
  if (!lastRefreshed) {
    const createdTimeStringUTC = athleteDoc.get('created');
    const createdDate = new Date(createdTimeStringUTC);
    lastRefreshed = getEpochSecondsFromDateObj(createdDate);

    athleteDoc.set('last_refreshed', lastRefreshed);
    await athleteDoc.save();
    console.log('Set last_refreshed timestamp from created');
  }

  return lastRefreshed;
}

/**
 * Quick converter for UNIX timestamp in seconds to ISO string
 *
 * @param {Number} timestamp
 * @return {String}
 */
function timestampToISOString(timestamp) {
  const theDate = new Date(timestamp * 1000);
  return theDate.toISOString();
}

/**
 * Get athlete's laps since last_update and update their stats
 *
 * @param {Number|Document} athlete ID or Document
 * @param {Number} after Optional UTC *seconds* to override last_updated
 * @param {Boolean} verbose Defaults to false
 */
async function refreshAthlete(athlete, after = false, verbose = false) {
  // Get user document
  const athleteDoc = typeof athlete === 'number'
    ? await Athlete.findById(athlete)
    : athlete;

  // Fetch activities
  const fetchTimestamp = after
    || await getFetchTimestampFromAthlete(athleteDoc, verbose);

  console.log(`\n----\nFetching new activities for ${athleteDoc.get('athlete.firstname')} ${athleteDoc.get('athlete.lastname')} (${athleteDoc.get('_id')}) since ${timestampToISOString(fetchTimestamp)}`);

  // Get activities that *might* have laps
  const eligibleActivities = await fetchAthleteActivities(
    athleteDoc,
    fetchTimestamp,
    verbose,
  );

  if (!eligibleActivities.length) {
    console.log(`No eligible activities for user ${athleteDoc.get('_id')}`);
    return;
  }

  // Add new activities to database
  // @note Use new token refresh logic
  const activitiesWithLaps = await fetchLapsFromActivities(
    eligibleActivities,
    athleteDoc.get('access_token'),
    verbose,
  );

  if (!activitiesWithLaps.length) {
    console.log(`No new activities *with laps* for user ${athleteDoc.get('_id')}`);
    return;
  }

  // Filter for valid activities
  const filtered = activitiesWithLaps.reduce((acc, activity) => {
    const activityDoc = new Activity(activity);
    // Mongoose returns error here instead of throwing
    const err = activityDoc.validateSync();
    if (err) {
      console.warn(`Failed to validate activity ${activity.get('_id')}`);
    } else {
      acc.push(activityDoc);
    }
    return acc;
  }, []);

  await Activity.create(filtered);
  console.log(`Created ${filtered.length} new activities`);

  // Merge into user document's stats
  const stats = await compileStatsForActivities(
    filtered,
    athleteDoc.toJSON().stats,
  );
  console.log(`Found ${stats.allTime - athleteDoc.get('stats.allTime')} new laps`);

  // Update user stats and last_updated
  await updateAthleteStats(athleteDoc, stats);
}

module.exports = refreshAthlete;
