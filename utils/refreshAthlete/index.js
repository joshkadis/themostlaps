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
 * @param {Number} id
 * @param {Number} after Optional UTC *seconds* to override last_updated
 */
module.exports = async (id, after = false) => {
  // Get user document
  const athlete = await Athlete.findById(id);

  // Fetch activities since user document's last_updated
  const eligibleActivities = await fetchAthleteActivities(
    athlete.get('access_token'),
    after || getTimestampFromISO(athlete.get('last_updated'))
  );

  if (!eligibleActivities.length) {
    return;
  }

  // Add new activities to database
  const activitiesWithLaps = await fetchLapsFromActivities(
    eligibleActivities,
    athlete.get('access_token')
  );

  if (!activitiesWithLaps.length) {
    console.log(`No new activities for user ${id}`)
    return;
  }

  // Filter for valid activities
  const filtered = activitiesWithLaps.reduce((acc, activity) => {
    const activityDoc = new Activity(activity);
    const err = activityDoc.validateSync();
    if (err) {
      console.warn(`Failed to validate activity ${activity._id}`);
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
  const stats = compileStatsForActivities(filtered, athlete.toJSON().stats);
  console.log(`Found ${stats.allTime - athlete.get('stats.allTime')} new laps`);

  // Update user stats and last_updated
  await updateAthleteStats(athlete, stats);
  return true;
};
