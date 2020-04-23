const { setupConnection } = require('../utils/setupConnection');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');
const { getLocationNames } = require('../../utils/v2/locations');
const Athlete = require('../../schema/Athlete');
const { asyncIngestSingleLocation } = require('../../utils/v2/ingestAthlete/ingestAthleteHistory');
const { captureSentry } = require('../../utils/v2/services/sentry');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';

/**
 * Ingest a specified location for all athletes
 */
async function doCommand({
  dryRun: isDryRun = false,
  subargs = [],
  limit = 0,
  skip = 0,
}) {
  if (!subargs.length || getLocationNames().indexOf(subargs[0]) === -1) {
    console.warn(`Requires valid location, one of: ${JSON.stringify(getLocationNames())}`);
    return;
  }
  const location = subargs[0];

  if (isDryRun) {
    console.log(DRY_RUN_MSG);
  }

  const migrationKey = `ingest${location.toLowerCase()}`;
  const athleteDocs = await Athlete.find(
    { [`migration.${migrationKey}`]: { $ne: true } },
    null,
    { limit, skip },
  );

  const migrateLocationForAthlete = async (athleteDoc) => {
    try {
      await asyncIngestSingleLocation(
        location,
        athleteDoc,
        isDryRun,
      );

      athleteDoc.set({
        migration: {
          ...(athleteDoc.migration || {}),
          [migrationKey]: true,
        },
      });
      athleteDoc.markModified('migration');
      if (!isDryRun) {
        await athleteDoc.save();
      }

      return { success: true };
    } catch (err) {
      captureSentry(err, 'ingestlocation', {
        athleteId: athleteDoc.id,
        location,
      });
      return { success: false, id: athleteDoc.id };
    }
  };
  const iterable = makeArrayAsyncIterable(
    athleteDocs,
    migrateLocationForAthlete,
  );

  console.log(`Ingesting location ${location} for ${athleteDocs.length} athletes`);

  const results = {
    Success: 0,
    Error: 0,
    ErrorIDs: [],
  };

  // eslint-disable-next-line
  for await (const result of iterable) {
    const {
      success,
      id = 0,
    } = result;
    if (success) {
      results.Success += 1;
    } else {
      results.Error += 1;
      results.ErrorIDs.push(id);
    }
  }
  console.table(results);

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
