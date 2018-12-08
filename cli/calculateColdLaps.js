const Activity = require('../schema/Activity');
const Athlete = require('../schema/Athlete');
const { getColdLapsFromActivity } = require('../utils/stats/compileSpecialStats');
const { updateAthleteStats } = require('../utils/athleteStats');

// Compile total points for array of activities
async function getTotalPointsFromActivities(activities, dryRun) {
  let totalPoints = 0;
  // Loop through activities asynchronously
  for (let i = 0; i < activities.length; i++) {
    const activityPoints = await getColdLapsFromActivity(activities[i]);
    console.log(`Activity ${activities[i].get('_id')} has ${activityPoints} points`);
    if (!dryRun) {
      // Set coldLapPoints property of Activity document
      activities[i].set('coldLapPoints', activityPoints);
      await activities[i].save();
    }
    if (activityPoints) {
      totalPoints = totalPoints + activityPoints;
    }
  }
  return totalPoints;
}


async function calculateColdLaps(fromActivity, dryRun) {
  // Fetch all activities starting with fromActivity
  const allActivities = await Activity.find({ _id: { $gte: fromActivity } });
  console.log(`Processing ${allActivities.length} activities${"\n"}------------------`);

  // Group by athlete
  const groupedActivities = allActivities.reduce((acc, activity) => {
    const athlete = activity.get('athlete_id');
    if (typeof acc[athlete] !== 'undefined' && acc[athlete].length) {
      acc[athlete] = [...acc[athlete], activity]
    } else {
      acc[athlete] = [activity];
    }
    return acc;
  }, {});

  // Loop through athletes
  const athleteIds = Object.keys(groupedActivities);
  for (let i = 0; i < athleteIds.length; i++) {
    const athleteId = athleteIds[i];
    const athleteActivities = groupedActivities[athleteId];
    console.log(`Processing athlete ${athleteId} (${athleteActivities.length} activities)`);

    const totalPoints = await getTotalPointsFromActivities(athleteActivities, dryRun)
    console.log(`${totalPoints} total Cold Laps points`);
    if (!dryRun) {
      // Set athlete stats
      const athleteDoc = await Athlete.findById(athleteId);
      const athleteStats = athleteDoc.get('stats');
      const { special = {} } = athleteStats;
      special.cold2019 = totalPoints;
      athleteStats.special = special;
      try {
        await updateAthleteStats(athleteDoc, athleteStats);
        console.log(`Updated stats for athlete ${athleteId}`);
      } catch (err) {
        console.log(`Failed to update stats for athlete ${athleteId}`);
      }
    }
    console.log(`------------------${"\n"}`);
  }

  process.exit(0);
}

module.exports = calculateColdLaps;
