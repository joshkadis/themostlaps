const Athlete = require('../../schema/Athlete');
const Activity = require('../../schema/Activity');
const getTimestampFromISO = require('../../utils').getTimestampFromISO;
const fetchAthleteActivities = require('./fetchAthleteActivities');
const fetchLapsFromActivities = require('./fetchLapsFromActivities');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../athleteStats');

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

  // Fetch activities since user document's last_updated
  const eligibleActivities = await fetchAthleteActivities(
    athleteDoc.get('access_token'),
    after || getTimestampFromISO(athleteDoc.get('last_updated')),
    verbose
  );

  if (!eligibleActivities.length) {
    console.log(`No new activities for user ${athleteDoc.get('_id')}`);
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
    return;
  }

  // Filter for valid activities
  const filtered = activitiesWithLaps.reduce((acc, activity) => {
    const activityDoc = new Activity(activity);
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
  await updateAthleteStats(athleteDoc, stats);
  return true;
};
