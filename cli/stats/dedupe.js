const cliProgress = require('cli-progress');
const { setupConnection } = require('../utils/setupConnection');
const { dedupeAthleteActivities } = require('../activity/dedupe');
const Athlete = require('../../schema/Athlete');

/**
 * Dedupe activity laps for all athletes
 */
async function dedupeAll({
  dryRun: isDryRun = false,
  verbose = false,
  athletes: athleteIds = '',
}) {
  // Setup
  const query = {};
  if (athleteIds.length) {
    const ids = athleteIds.split(',').map(Number);
    console.log(`Deduping segment efforts for athletes ${ids.join(', ')}`);
    // eslint-disable-next-line no-underscore-dangle
    query._id = { $in: ids };
  } else {
    console.log('Deduping segment efforts for all athletes!');
  }
  if (isDryRun) {
    console.log('*This is a dry run!*');
  }
  const athletes = await Athlete.find(query);
  if (!athletes || !athletes.length) {
    console.warn('No athletes were found');
    return;
  }

  const progressBar = new cliProgress.SingleBar();
  progressBar.start(athletes.length, 0);

  // Iterate over athletes
  const log = {
    athletes: 0,
    activities: 0,
    meanLaps: 0,
  };

  // eslint-disable-next-line no-restricted-syntax
  for await (const athleteDoc of athletes) {
    progressBar.increment();
    const result = await dedupeAthleteActivities(
      athleteDoc,
      [],
      isDryRun,
      verbose,
      'suppress',
    );
    if (result && result.abs.length) {
      log.athletes += 1;
      log.activities += result.abs.length;
      log.meanLaps += parseFloat(result.meanLaps);
      log.meanChange += parseFloat(result.meanChange);
    }
  }

  progressBar.stop();
  console.table({
    'Affected athletes': log.athletes,
    'Affected activities': log.activities,
    'Avg laps per affected activity': (log.meanLaps / log.athletes).toFixed(2),
    'Avg change per affected activity': (log.meanChange / log.athletes).toFixed(2),
  });
}

module.exports = {
  command: [
    'stats dedupe',
  ],
  describe: 'Dedupe all activities for all athletes',
  handler: async (args) => {
    if (!args.dedupe) {
      console.warn("You didn't call `$ stats dedupe`");
      return;
    }

    await setupConnection(args, dedupeAll);
  },
};
