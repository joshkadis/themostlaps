const Athlete = require('../../schema/Athlete');
const Activity = require('../../schema/Activity');
const getTimestampFromISO = require('../../utils').getTimestampFromISO;
const fetchAthleteActivities = require('./fetchAthleteActivities');
const fetchLapsFromActivities = require('./fetchLapsFromActivities');

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

  // Calculate stats for these recent activities
  const activitiesWithLaps = await fetchLapsFromActivities(
    eligibleActivities,
    athlete.get('access_token')
  );

  // Save activities to database

  // Merge into user document's stats

  // Update user stats and last_updated
};
