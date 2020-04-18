const { setupConnection } = require('../utils/setupConnection');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');
const Activity = require('../../schema/Activity');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';
const MIGRATE_LOCATION = 'prospectpark';

/**
 * Create v2 stats format activityLocations for legacy prospectpark activities
 */
async function doCommand({
  dryRun: isDryRun = false,
  limit = false,
}) {
  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  const activityDocs = await Activity.find(
    {
      activityLocations: { $exists: false },
    },
    null,
    limit ? { limit } : null,
  );

  if (!activityDocs.length) {
    console.log('No activities found without activityLocations field');
    return;
  }

  const migrateActivityFormat = async (doc) => {
    const activityLocations = [{
      location: MIGRATE_LOCATION,
      laps: doc.laps,
      segment_efforts: doc.segment_efforts,
    }];
    doc.set({
      activityLocations,
      migration: {
        ...(doc.migration || {}),
        location: true,
      },
    });
    doc.markModified('migration');
    doc.markModified('activityLocations');
    if (!isDryRun) {
      await doc.save();
    }
    return doc.id;
  };

  const iterable = makeArrayAsyncIterable(
    activityDocs,
    migrateActivityFormat,
  );

  console.log(`Migrating stats for ${activityDocs.length} activities`);

  const results = {
    success: [],
    error: [],
    effortsCheck: [],
  };

  // eslint-disable-next-line
  for await (const id of iterable) {
    // Check that it worked
    if (isDryRun) {
      results.success.push(id);
    } else {
      const checked = await Activity.findById(
        id,
        'activityLocations laps segment_efforts',
        { lean: true },
      );

      const {
        activityLocations = [],
        laps,
        segment_efforts,
      } = checked;

      const nextNumSegmentEfforts = activityLocations[0].segment_efforts.length;
      const prevNumSegmentEfforts = segment_efforts.length;
      if (
        activityLocations.length === 1
        && activityLocations[0].location === MIGRATE_LOCATION
        && activityLocations[0].laps === laps
        && nextNumSegmentEfforts === prevNumSegmentEfforts
      ) {
        results.success.push(id);
        if (nextNumSegmentEfforts > 0 && results.effortsCheck.length < 10) {
          results.effortsCheck.push(id);
        }
      } else {
        results.error.push(id);
      }
    }
  }

  console.table({
    Success: results.success.length,
    Error: results.error.length,
    CheckActivity: results.effortsCheck,
  });

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
