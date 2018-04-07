const Athlete = require('../../schema/Athlete');
const Activity = require('../../schema/Activity');
const { getTimestampFromISO } = require('../../utils');
const fetchAthleteActivities = require('./fetchAthleteActivities');
const fetchLapsFromActivities = require('./fetchLapsFromActivities');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../athleteStats');
const sendMonthlyEmail = require('../emails');
const { shouldSendMonthlyEmail } = require('../emails/utils');

/**
 * Get timestamp of athlete's most recently created activity (highest activity ID)
 * or fall back to athlete document's last_updated
 *
 * @param {Document} athleteDoc
 * @param {Boolean} verbose Defaults to false
 * @return {Number} UTC *seconds*
 */
async function getFetchTimestampFromAthlete(athleteDoc, verbose = false) {
  const logPrepend = 'Searching for activities since';
  let ISOString = athleteDoc.get('last_updated');
  try {
    const lastActivity = await Activity.findOne(
      { athlete_id: athleteDoc.get('_id') },
      'start_date_local',
      {
        limit: 1,
        sort: { '_id': -1 },
      }
    );

    if (lastActivity) {
      ISOString = lastActivity.get('start_date_local');
      if (verbose) {
        console.log(`${logPrepend} ${lastActivity.get('_id')} at ${ISOString}`);
      }
    } else if (verbose) {
      console.log(`${logPrepend} athlete last_updated at ${ISOString}`);
    }
  } catch(err) {
    console.log('Error fetching lastActivity');
  }

  return getTimestampFromISO(ISOString);
}

/**
 * Get athlete's laps since last_update and update their stats
 *
 * @param {Number|Document} athlete ID or Document
 * @param {Number} after Optional UTC *seconds* to override last_updated
 * @param {Boolean} verbose Defaults to false
 */
module.exports = async (athlete, after = false, verbose = false) => {
  // Get user document
  const athleteDoc = 'number' === typeof athlete ?
    await Athlete.findById(athlete) : athlete;

  console.log(`Fetching new activities for ${athleteDoc.get('athlete.firstname')} ${athleteDoc.get('athlete.lastname')} (${athleteDoc.get('_id')})`);

  // Fetch activities
  const fetchTimestamp = after || await getFetchTimestampFromAthlete(athleteDoc, verbose);

  const eligibleActivities = await fetchAthleteActivities(
    athleteDoc.get('access_token'),
    fetchTimestamp,
    verbose
  );

  if (!eligibleActivities.length) {
    console.log(`No eligible activities for user ${athleteDoc.get('_id')}`);
    if (shouldSendMonthlyEmail(athleteDoc)) {
      sendMonthlyEmail(athleteDoc);
    }
    return;
  }

  // Add new activities to database
  const activitiesWithLaps = await fetchLapsFromActivities(
    eligibleActivities,
    athleteDoc.get('access_token'),
    verbose
  );

  if (!activitiesWithLaps.length) {
    console.log(`No new activities *with laps* for user ${athleteDoc.get('_id')}`);
    if (shouldSendMonthlyEmail(athleteDoc)) {
      sendMonthlyEmail(athleteDoc);
    }
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

  try {
    await Activity.create(filtered);
    console.log(`Created ${filtered.length} new activities`)
  } catch (err) {
    console.log(err);
  }

  // Merge into user document's stats
  const stats = compileStatsForActivities(filtered, athleteDoc.toJSON().stats);
  console.log(`Found ${stats.allTime - athleteDoc.get('stats.allTime')} new laps`);

  // Update user stats and last_updated
  const updatedAthleteDoc = await updateAthleteStats(athleteDoc, stats);

  if (shouldSendMonthlyEmail(updatedAthleteDoc)) {
    sendMonthlyEmail(updatedAthleteDoc);
  }

  return true;
};
