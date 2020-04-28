const cliProgress = require('cli-progress');
const { setupConnection } = require('../utils/setupConnection');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');
const Athlete = require('../../schema/Athlete');
const qaAthlete = require('../utils/qaAthlete');
/**
 * QA results of complete migration
 */
async function doCommand({
  limit = 0,
  skip = 0,
}) {
  const allAthletes = await Athlete.find(
    {},
    null,
    {
      lean: true,
      limit,
      skip,
    },
  );

  const doAthleteQA = async (athlete) => qaAthlete(athlete);

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  progressBar.start(allAthletes.length, 0);

  const iterable = makeArrayAsyncIterable(
    allAthletes,
    doAthleteQA,
  );

  console.log(`Migration QA for ${allAthletes.length} athletes`);

  const results = {
    Success: 0,
    Failures: 0,
  };

  const failed = [];

  // eslint-disable-next-line
  for await (const result of iterable) {
    const {
      success = false,
      id = 0,
    } = result;

    if (success) {
      results.Success += 1;
    } else {
      results.Failures += 1;
      failed.push(id);
    }
    progressBar.increment();
  }
  progressBar.stop();

  console.table(results);
  if (results.Failures) {
    console.log(failed);
  }
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
