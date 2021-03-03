const ProgressBar = require('progress');
const { promises: timersPromise } = require('timers');
const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const Athlete = require('../../schema/Athlete');
const fetchStravaApi = require('../../utils/fetchStravaAPI');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete refreshprofile --all or $ athlete refreshprofile');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';
const WAIT_INCREMENT = 16 * 60 * 1000; // Give it an extra minute

const getRateLimits = (response, headerKey) => response.headers
  .get(headerKey)
  .split(',')
  .map((num) => Number(num));

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
  const resultsLog = {};
  const logResult = (id, status, detail) => resultsLog.push({
    id,
    status,
    detail,
  });
  const bar = new ProgressBar(':bar', { total: athleteDocs.length });
  const updateAthlete = async (athleteDoc) => {
    bar.tick();
    const response = await fetchStravaApi('/athlete', athleteDoc, false, false);

    // handle bad response, deauthorized, etc
    if (response.status >= 400) {
      const msg = response.status === 429
        ? '429 response, reached rate limit. Try again later.'
        : `${athleteDoc._id}\t${response.status}`;
      console.log(msg);
      logResult(athleteDoc._id, response.status, 'Error');
      return;
    }

    // Set interval and wait if response status is exceeded limit
    const [usage, usageDay] = getRateLimits(response, 'X-RateLimit-Usage');
    const [limit, limitDay] = getRateLimits(response, 'X-RateLimit-Limit');

    if ((limitDay - usageDay) < 300) {
      console.log(`Used ${usageDay} of ${limitDay} daily API requests. Try again tomorrow`);
      return;
    }

    if ((limit - usage) < 30) {
      const resetDate = new Date(Date.now() + WAIT_INCREMENT);
      console.log(`Used ${usage} of ${limit} 15min API requests. Will continue at ${resetDate.toISOString()}.`);
      await timersPromise.setTimeout(WAIT_INCREMENT);
    }

    // set athleteDoc properties and save
    const { premium, created_at } = await response.json();
    if (!isDryRun) {
      athleteDoc.set('premium', premium);
      athleteDoc.set('athlete', {
        ...athleteDoc.athlete,
        created_at,
      });
      await athleteDoc.update();
    }

    // return result for logging
    logResult(athleteDoc._id, response.status, 'Success');
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
