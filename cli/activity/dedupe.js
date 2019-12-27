/**
 * `$ activity dedupe ...` commands. I don't think we can use
 * `.commandDir()` because our CLI needs to be backwards-compatible
 */

const Activity = require('../../schema/Activity');

/**
 * Handle a CLI command like `$ article dedupe...`
 *
 * @param {Object} args From yargs
 */
async function doCommand(args) {
  if (!args.dedupe) {
    console.warn("You didn't call `$ activity dedupe ...`");
    return;
  }

  const isDryRun = args.dryRun || false;

  const query = {};
  // query includes athlete
  if (args.a || args.athlete) {
    query.athlete_id = args.a || args.athlete;
  }
  // query inludes activity ids
  if (args.subargs.length) {
    // eslint-disable-next-line no-underscore-dangle
    query._id = { $in: args.subargs };
  }

  console.log(`Running find query for: ${JSON.stringify(query)}`);

  const activities = Activity.find(query);
  if (!activities || !activities.length) {
    console.log('No activities were found.');
  }
  console.log(`Found ${activities.length} activities`);

  for await (const activity of activities) {
    continue;
  }
}

module.exports = {
  doCommand,
};
