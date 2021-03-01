const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const Athlete = require('../../schema/Athlete');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete refreshprofile --all or $ athlete refreshprofile');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';
/**
 * Migrate an athlete from v1 to v2 stats format
 */
async function doCommand({
  subargs,
  dryRun: isDryRun = false,
  all: updateAll = false,
  verbose = true,
}) {
  if (!updateAll && !checkNumArgs(subargs, 1, '<athleteIds>')) {
    return false;
  }

  if (subargs.length && updateAll) {
    console.log('Cannot provide athlete ID(s) and use flag --all at the same time');
    return false;
  }

  if (isDryRun && verbose) {
    console.log(DRY_RUN_MSG);
  }

  const findArgs = {
    status: 'ready',
  };

  if (!updateAll) {
    // Get array of IDs from csv string arg
    const athleteIds = subargs[0]
      .toString() // easy way to handle if single ID is cast as a Number
      .split(',')
      .reduce((acc, id) => {
        const parsedId = parseInt(id, 10);
        if (!Number.isNaN(parsedId) && parsedId > 0) {
          acc.push(parsedId);
        }
        return acc;
      }, []);
    findArgs._id = { $in: athleteIds };
  }

  const athleteDocs = await Athlete.find(findArgs);
  console.log(`Found ${athleteDocs.length} Athlete documents`);

  const updateAthlete = async (athleteDoc) => {
    const athleteData = await fetchStravaApi('/athlete', athleteDoc);
    // handle bad response, deauthorized, etc

    // Set interval and wait if response status is exceeded limit

    // set athleteDoc properties and save

    // return result for logging
  };

  // async iterator over athleteDocs

  return true;
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
  recalculateAthlete: doCommand,
};
