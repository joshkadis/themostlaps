const cliProgress = require('cli-progress');
const { setupConnection } = require('../utils/setupConnection');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');
const Athlete = require('../../schema/Athlete');
const Activity = require('../../schema/Activity');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';

/**
 * Convert Athlete documents from v1 stats format to v2
 */
async function doCommand({
  dryRun: isDryRun = false,
  limit = 0,
  skip = 0,
  version,
}) {
  const nextVersion = version || 'v1';
  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  /**
   * Athletes
   */
  console.log(`Preparing athletes for ${nextVersion}`);

  const athletes = await Athlete.find({}, null, { limit, skip });

  const athletesResults = {
    stats_version: 0,
    app_version: 0,
    emptied_locations: 0,
    location_pp: 0,
  };

  const prepAthlete = async (doc) => {
    try {
      if (doc.app_version !== nextVersion) {
        doc.set({ app_version: nextVersion });
        athletesResults.app_version += 1;
      }
      if (doc.stats_version !== nextVersion) {
        doc.set({ stats_version: nextVersion });
        athletesResults.stats_version += 1;
      }
      if (!doc.stats.allTime) {
        doc.set('locations', []);
        athletesResults.emptied_locations += 1;
      } else {
        athletesResults.location_pp += 1;
        doc.set('locations', ['prospectpark']);
      }
      doc.markModified('locations');

      if (!isDryRun) {
        await doc.save();
      }
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const athletesIterable = makeArrayAsyncIterable(
    athletes,
    prepAthlete,
  );

  const progressBar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  progressBar1.start(athletes.length, 0);

  // eslint-disable-next-line
  for await (const res of athletesIterable) {
    if (res) {
      progressBar1.increment();
    } else {
      return;
    }
  }
  progressBar1.stop();
  console.table(athletesResults);

  /**
   * Activities
   */
  console.log(`Preparing activities for ${nextVersion}`);
  const activitiesResults = { app_version: 0 };
  const activities = await Activity.find(
    { app_version: { $ne: nextVersion } },
    null,
    { limit, skip },
  );

  if (!activities.length) {
    console.log(`All activities have been set to ${nextVersion}`);
    return;
  }

  const prepActivity = async (doc) => {
    try {
      if (doc.app_version !== version) {
        doc.set('app_version', nextVersion);
        activitiesResults.app_version += 1;
      }
      if (!isDryRun) {
        await doc.save();
      }
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const activitiesIterable = makeArrayAsyncIterable(
    activities,
    prepActivity,
  );

  const progressBar2 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  progressBar2.start(activities.length, 0);

  // eslint-disable-next-line
  for await (const res of activitiesIterable) {
    if (res) {
      progressBar2.increment();
    } else {
      return;
    }
  }
  progressBar2.stop();
  console.table(activitiesResults);

  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
