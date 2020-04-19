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
  force = false,
  version,
}) {
  const nextVersion = version || 'v1';
  const shouldSetVersion = (doc, prop) => (
    force
    || typeof doc[prop] === 'undefined'
  );

  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  /**
   * Athletes
   */
  console.log(`Preparing athletes for ${nextVersion}`);

  const athletes = await Athlete.find({}, null, { limit, skip });

  const prepAthlete = async (doc) => {
    try {
      if (shouldSetVersion(doc, 'stats_version')) {
        doc.set('stats_version', nextVersion);
      }
      if (shouldSetVersion(doc, 'app_version')) {
        doc.set('app_version', nextVersion);
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

  /**
   * Activities
   */
  console.log(`Preparing activities for ${nextVersion}`);

  const activities = await Activity.find({}, null, { limit, skip });

  const prepActivity = async (doc) => {
    try {
      if (shouldSetVersion(doc, 'app_version')) {
        doc.set('app_version', nextVersion);
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
