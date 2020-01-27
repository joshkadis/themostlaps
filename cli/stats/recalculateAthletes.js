const { setupConnection } = require('../utils/setupConnection');
const {
  compileStatsForActivities,
} = require('../../utils/athleteStats');
const Activity = require('../../schema/Activity');
const Athlete = require('../../schema/Athlete');

/**
 * Loop through all athletes and recalculate stats
 * *without* updating any activity documents
 */
async function doCommand({
  dryRun: isDryRun = false,
}) {
  const athletes = await Athlete.find({});
  // eslint-disable-next-line
  for await (const athlete of athletes) {
    const {
      _id: athlete_id,
      stats = {},
      athlete: {
        firstname,
        lastname,
      },
      stats_version,
    } = athlete.toJSON();

    if (stats_version === 'v2') {
      console.log(`Athlete ${athlete_id} (${firstname} ${lastname}) already upgraded to V2 stats`);
      return;
    }

    const { allTime: prevAllTime = 0 } = stats;
    const activities = await Activity.find({ athlete_id });
    const nextStats = await compileStatsForActivities(activities);

    if (prevAllTime !== nextStats.allTime) {
      console.log(`${athlete_id} | ${prevAllTime} | ${nextStats.allTime}`);
      athlete.set({ stats: nextStats });
      athlete.markModified('stats');
      if (!isDryRun) {
        await athlete.save();
      }
    }
  }
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
