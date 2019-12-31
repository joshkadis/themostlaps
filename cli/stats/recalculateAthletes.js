const { setupConnection } = require('../utils/setupConnection');
const {
  compileStatsForActivities,
} = require('../../utils/athleteStats');
const Activity = require('../../schema/Activity');
const Athlete = require('../../schema/Athlete');


/**
 * Some activities that were ingested very early on have their segment_efforts property
 * as an array of objects in Strava API's schema. We need to convert those
 * to use our own SegmentEffort schema.
 */
async function doCommand({
  dryRun: isDryRun = false,
}) {
  const athletes = await Athlete.find({});
  // eslint-disable-next-line
  for await (const athlete of athletes) {
    const { _id: athlete_id, stats = {} } = athlete.toJSON();
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
