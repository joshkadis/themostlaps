/**
 * `$ activity dedupe ...` commands. I don't think we can use
 * `.commandDir()` because our CLI needs to be backwards-compatible
 */
const mean = require('lodash/mean');
const sum = require('lodash/sum');
const Athlete = require('../../schema/Athlete');
const Activity = require('../../schema/Activity');
const { setupConnection } = require('../utils/setupConnection');
const { dedupeSegmentEfforts } = require('../../utils/refreshAthlete/utils');
const { updateAthleteStatsFromActivity } = require('../../utils/v2/stats/athleteStats');

/**
 * Dedupe segment efforts and update laps for an existing activity
 *
 * @param {Activity} activity Activity document
 */
function dedupeActivity(activity) {
  const { segment_efforts, laps } = activity;
  if (!segment_efforts || !segment_efforts.length) {
    return;
  }

  const dedupedEfforts = dedupeSegmentEfforts(segment_efforts);

  if (dedupedEfforts.length === segment_efforts.length) {
    return;
  }

  const nextLaps = laps - segment_efforts.length + dedupedEfforts.length;

  activity.set({
    segment_efforts: dedupedEfforts,
    laps: nextLaps,
  });
}

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
  verbose = false,
  dedupe = false,
}) {
  if (!dedupe) {
    console.warn("You didn't call `$ activity dedupe ...`");
    return;
  }

  const athleteId = a || athlete;
  if (!athleteId) {
    console.warn('Must specify an athlete or activity id(s)');
    return;
  }
  const athleteDoc = await Athlete.findById(athleteId);
  if (!athleteDoc) {
    console.warn(`Could not find athlete ${athleteId}`);
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
  if (isDryRun) {
    console.log('*This is a dry run!*');
  }

  const activities = await Activity.find(query);
  if (!activities || !activities.length) {
    console.log('No activities were found.');
    return;
  }
  console.log(`Found ${activities.length} activities`);

  const summary = {
    processed: 0,
    abs: [],
    rel: [],
    earliest: 'n/a',
    latest: 'n/a',
  };

  const log = {};

  // eslint-disable-next-line no-restricted-syntax
  for await (const activity of activities) {
    const {
      laps: prevLaps,
      start_date_local: startDateStr,
    } = activity;
    dedupeActivity(activity);
    const nextLaps = activity.laps;
    const delta = nextLaps - prevLaps;
    summary.processed += 1;
    if (delta < 0) {
      log[activity.id] = {
        delta,
        prevLaps,
        nextLaps,
        date: activity.start_date_local,
      };
      if (!summary.abs.length) {
        // assume order of activity IDs matches order of activity start times
        summary.earliest = activity.start_date_local;
      }
      summary.latest = activity.start_date_local;
      summary.abs.push(delta);
      summary.rel.push((delta / prevLaps));

      updateAthleteStatsFromActivity(athleteDoc, delta, startDateStr);

      if (!isDryRun) {
        await activity.save();
      }
    }
  }
  if (!isDryRun) {
    await athleteDoc.save();
  }

  if (verbose) {
    console.table(log);
  }

  const meanChange = summary.abs.length
    ? (mean(summary.abs)).toFixed(2)
    : 'n/a';

  const meanPercentChange = summary.rel.length
    ? (mean(summary.rel)).toFixed(2)
    : 'n/a';

  console.table({
    Processed: summary.processed,
    Affected: summary.abs.length,
    'Total change': sum(summary.abs),
    'Avg change': meanChange,
    'Avg % change': meanPercentChange,
    Earliest: summary.earliest,
    Latest: summary.latest,
  });
}

module.exports = {
  command: [
    'activity dedupe [<subargs...>]',
  ],
  describe: 'Dedupe laps by activity or athlete',
  handler: async (args) => {
    await setupConnection(args, doCommand);
  },
};
