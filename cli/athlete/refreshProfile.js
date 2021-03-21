const ProgressBar = require('progress');
const timersPromises = require('timers/promises'); // Node 15 only
const { setupConnection } = require('../utils/setupConnection');
const { makeCheckNumArgs } = require('../utils');
const Athlete = require('../../schema/Athlete');
const fetchStravaApi = require('../../utils/fetchStravaAPI');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');

const checkNumArgs = makeCheckNumArgs('Use format: $ athlete refreshprofile --all or $ athlete refreshprofile');

const DRY_RUN_MSG = '** THIS IS A DRY RUN **';
const WAIT_INCREMENT = 30 * 1000; // 10s for testing
// 16 * 60 * 1000; // Give it an extra minute
const USAGE_BUFFER = 550; // 30;
const USAGE_BUFFER_DAILY = 300;

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
  verbose = false,
}) {
  if (!updateAll && !checkNumArgs(subargs, 1, '<athleteIds>')) {
    return false;
  }

  if (subargs.length && updateAll) {
    console.log('Cannot provide athlete ID(s) and use flag --all at the same time');
    return false;
  }

  if (isDryRun) {
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
  const resultsLog = [];
  const logResult = (id, status, detail) => resultsLog.push({
    id,
    status,
    detail,
  });

  const updateAthlete = async (athleteDoc) => {
    if (verbose) {
      const {
        athlete: {
          firstname,
          lastname,
        },
        _id,
      } = athleteDoc.toJSON();
      console.log(`${firstname} ${lastname} | ${_id}`);
    }
    const response = await fetchStravaApi('/athlete', athleteDoc, false, true);

    // handle bad response, deauthorized, etc
    if (response.status >= 400 || !response.status) {
      const responseError = response.status || 'unknown';
      logResult(athleteDoc._id, responseError, 'Error');
      const msg = responseError === 429
        ? '429 response, reached rate limit. Try again later.'
        : `${athleteDoc._id}\t${responseError}`;
      return new Error(msg);
    }

    // Set interval and wait if response status is exceeded limit
    const [usage, usageDay] = getRateLimits(response, 'X-RateLimit-Usage');
    const [limit, limitDay] = getRateLimits(response, 'X-RateLimit-Limit');

    if ((limitDay - usageDay) < USAGE_BUFFER_DAILY) {
      return new Error(`Used ${usageDay} of ${limitDay} daily API requests. Try again tomorrow`);
    }

    if ((limit - usage) < USAGE_BUFFER) {
      const resetDate = new Date(Date.now() + WAIT_INCREMENT);
      console.log(`Used ${usage} of ${limit} 15min API requests. Will continue at ${resetDate.toISOString()}.`);
      await timersPromises.setTimeout(WAIT_INCREMENT);
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
    return true;
  };

  // async iterator over athleteDocs
  const bar = new ProgressBar(':bar', { total: athleteDocs.length });
  const docsIterator = makeArrayAsyncIterable(athleteDocs, updateAthlete);
  for await (const result of docsIterator) {
    if (result instanceof Error) {
      throw result;
    }
    bar.tick();
  }


  return true;
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
  recalculateAthlete: doCommand,
};
