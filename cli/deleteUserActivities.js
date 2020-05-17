const Activity = require('../schema/Activity');
const Athlete = require('../schema/Athlete');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../utils/athleteStats');

module.exports = async (user, after) => {
  // Find all of user's activities
  const userActivities = await Activity.find({ athlete_id: user });
  console.log(`User has ${userActivities.length} total activities`);

  if (!userActivities.length) {
    process.exit(0);
  }

  // Delete or save as applicable
  const savedActivities = [];
  for (let i = 0; i < userActivities.length; i += 1) {
    const activity = userActivities[i];
    const activityDate = new Date(activity.get('start_date_local'));
    const activityTimestamp = Math.floor(activityDate.valueOf() / 1000);

    // Delete activities after the cutoff date
    if (activityTimestamp > after) {
      console.log(`Deleting activity ${activity.get('_id')} from ${activity.get('start_date_local')}`);
      await Activity.findByIdAndRemove(activity.get('_id'));
    } else {
      // Save activities for recalculating status
      savedActivities.push(activity);
    }
  }

  // Reset last_refreshed timestamp
  const athlete = await Athlete.findById(user);
  try {
    athlete.set('last_refreshed', after);
    const lastUpdatedDoc = await athlete.save();
    const theDate = new Date(lastUpdatedDoc.get('last_refreshed') * 1000);
    console.log(`Set last_refreshed to ${theDate.toISOString()}`);
  } catch (err) {
    console.log(`Error saving last_refreshed to ${after}`);
  }

  if (savedActivities.length === userActivities.length) {
    console.log('No activities were deleted. Try a longer `daysago` value?');
    process.exit(0);
  }

  // Recalculate stats and update the user
  const stats = await compileStatsForActivities(savedActivities);
  await updateAthleteStats(athlete, stats);
  console.log(`Updated stats for ${savedActivities.length} activities. New total is ${stats.allTime}`);
  process.exit(0);
};
