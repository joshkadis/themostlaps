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
async function doCommand({
  a = false,
  athlete = false,
  subargs = [],
  dryRun: isDryRun = false,
  dedupe = false,
}) {
  if (!dedupe) {
    console.warn("You didn't call `$ activity dedupe ...`");
    return;
  }

  if (isDryRun) {
    console.log('*This is a dry run!*');
  }

  if (!a && !athlete && !subargs.length) {
    console.warn('Must specify an athlete or activity id(s)');
    return;
  }

  const query = {};
  // query includes athlete
  if (a || athlete) {
    query.athlete_id = a || athlete;
  }

  // query inludes activity ids
  if (subargs.length) {
    // eslint-disable-next-line no-underscore-dangle
    query._id = { $in: subargs };
  }

  const msg = `Deduping ${subargs.length || '*all*'} activities${query.athlete_id ? ` for Athlete ${query.athlete_id}` : ''}`;
  console.log(msg);

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
