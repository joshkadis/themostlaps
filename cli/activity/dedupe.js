/* eslint-disable no-underscore-dangle */

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
  const { segment_efforts } = activity;
  if (!segment_efforts || !segment_efforts.length) {
    return;
  }

  const dedupedEfforts = dedupeSegmentEfforts(segment_efforts);

  const nextLaps = dedupedEfforts.length + 1;

  activity.set({
    segment_efforts: dedupedEfforts,
    laps: nextLaps,
  });
  activity.markModified('segment_efforts');
}

/**
 * Dedupe segment efforts for all activities by an athlete
 *
 * @param {Athlete} athleteDoc Athlete document
 * @param {Array} activityIds Array of Activity ids
 * @param {Bool} isDryRun
 * @param {Bool} verbose
 * @param {Bool} supress Kill almost all logging
 * @return {Object} Result of process
 */
async function dedupeAthleteActivities(
  athleteDoc,
  activityIds = [],
  isDryRun = false,
  verbose = true,
  suppress = false,
) {
  const query = {
    athlete_id: athleteDoc._id,
  };

  if (activityIds.length) {
    query._id = { $in: activityIds };
  }

  if (!suppress) {
    const msg = `Deduping ${activityIds.length || '*all*'} activities${query.athlete_id ? ` for Athlete ${query.athlete_id}` : ''}`;
    console.log(msg);

    if (isDryRun) {
      console.log('*This is a dry run!*');
    }
  }

  const activities = await Activity.find(query);
  if (!activities || !activities.length) {
    if (!suppress) {
      console.log('No activities were found.');
    }
    return false;
  }
  if (!suppress) {
    console.log(`Found ${activities.length} activities`);
  }

  const summary = {
    processed: 0,
    laps: [], // "true" number of laps
    abs: [], // size of delta
    rel: [], // delta as % of total
    earliest: 'n/a',
    latest: 'n/a',
  };

  const log = {};

  // eslint-disable-next-line no-restricted-syntax
  for await (const activity of activities) {
    summary.processed += 1;
    const {
      laps: prevLaps,
      start_date_local: startDateStr,
      segment_efforts: prevSegmentEfforts,
    } = activity;
    dedupeActivity(activity);
    const {
      laps: nextLaps,
      segment_efforts: nextSegmentEfforts,
    } = activity;

    const delta = nextLaps - prevLaps;
    const deltaEfforts = nextSegmentEfforts.length - prevSegmentEfforts.length;

    if (delta !== 0 || deltaEfforts !== 0) {
      log[activity._id] = {
        delta,
        deltaEfforts,
        prevLaps,
        nextLaps,
        date: activity.start_date_local,
      };
      if (!summary.abs.length) {
        // assume order of activity IDs matches order of activity start times
        summary.earliest = activity.start_date_local;
      }
      summary.latest = activity.start_date_local;
      summary.laps.push(nextLaps);
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

  if (verbose && !suppress) {
    console.table(log);
  }

  const meanLaps = summary.laps.length
    ? (mean(summary.laps)).toFixed(2)
    : 'n/a';

  const meanChange = summary.abs.length
    ? (mean(summary.abs)).toFixed(2)
    : 'n/a';

  const meanPercentChange = summary.rel.length
    ? (mean(summary.rel)).toFixed(2)
    : 'n/a';

  // If suppressing (e.g. calling from another command)
  // only show result table if there were affected activities
  if (!suppress || (verbose && summary.abs.length)) {
    console.table({
      Processed: summary.processed,
      Affected: summary.abs.length,
      'Total change': sum(summary.abs),
      'Avg laps/activity': meanLaps,
      'Avg change': meanChange,
      'Avg % change': meanPercentChange,
      Earliest: summary.earliest,
      Latest: summary.latest,
    });
  }

  return {
    ...summary,
    meanChange,
    meanPercentChange,
    meanLaps,
  };
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
  subcommand = '',
}) {
  if (subcommand !== 'dedupe') {
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

  await dedupeAthleteActivities(
    athleteDoc,
    subargs.length ? subargs : [], // activity Ids
    isDryRun,
    verbose,
  );
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
  dedupeAthleteActivities,
};
