const cliProgress = require('cli-progress');
const { setupConnection } = require('../utils/setupConnection');
const {
  filterSegmentEfforts,
} = require('../../utils/refreshAthlete/utils');
const Activity = require('../../schema/Activity');


/**
 * Some activities that were ingested very early on have their segment_efforts property
 * as an array of objects in Strava API's schema. We need to convert those
 * to use our own SegmentEffort schema.
 */
async function doCommand({
  dryRun: isDryRun = false,
  limit = 0,
  ids = [],
}) {
  console.log('Finding activities...');

  // Find activities
  const activities = await Activity
    .find(
      ids.length ? { _id: { $id: ids } } : {},
    )
    .limit(limit || null);

  // Setup logging
  console.log(`Processing ${activities.length} activities`);
  const progressBar = new cliProgress.SingleBar();
  progressBar.start(activities.length, 0);
  const log = [];

  // eslint-disable-next-line no-restricted-syntax
  for await (const activity of activities) {
    progressBar.increment();
    const {
      segment_efforts,
      laps: numLaps,
    } = activity.toJSON();
    const prevNumSegmentEfforts = segment_efforts.length;

    // Skip if segment efforts are already processed correctly
    // of if they're missing entirely
    if (numLaps < prevNumSegmentEfforts && prevNumSegmentEfforts > 0) {
      // Convert to our SegmentEffort schema and reset document
      const filteredEfforts = filterSegmentEfforts(segment_efforts);
      activity.set({ segment_efforts: filteredEfforts });
      activity.markModified('segment_efforts');

      // Log if the number of segment efforts has been reduced
      if (prevNumSegmentEfforts > filteredEfforts.length) {
        log.push({
          Prev: prevNumSegmentEfforts,
          Next: filteredEfforts.length,
          Delta: filteredEfforts.length - prevNumSegmentEfforts,
        });
      }

      if (isDryRun) {
        await activity.save();
      }
    }
  }

  progressBar.stop();
  console.log(`Updated ${log.length} of ${activities.length} activities`);
  console.table(log);
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
