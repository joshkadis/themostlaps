const _cloneDeep = require('lodash/cloneDeep');
const { setupConnection } = require('../utils/setupConnection');
const Activity = require('../../schema/Activity');
const Athlete = require('../../schema/Athlete');
const { fetchActivity } = require('../../utils/refreshAthlete/utils');
const { transformActivity } = require('../../utils/v2/stats/transformActivity');

const getEffortsIdsString = (segmentEfforts) => JSON.stringify(
  segmentEfforts.map(({ _id }) => _id),
);

const stringifyActivity = (activity) => {
  const segment_efforts = getEffortsIdsString(activity.segment_efforts);
  const activityLocations = activity.activityLocations.map((loc) => {
    // eslint-disable-next-line no-param-reassign
    loc.segment_efforts = getEffortsIdsString(loc.segment_efforts);
    return loc;
  });
  return JSON.stringify({
    ...activity,
    segment_efforts,
    activityLocations,
  }, null, 2);
};

/**
 * Handle a CLI command `$ activity info <activityId> [<athleteId>] [--no-fetch]`
 *
 * @param {Object} args From yargs
 */
async function doCommand({ subargs, fetch: shouldFetch = true }) {
  const activityId = Number(subargs[0]);
  const athleteId = Number(subargs[1] || 0);

  if (!athleteId && shouldFetch) {
    console.warn('Command requires at least one of <athleteId> or --no-fetch');
    return;
  }

  const activityDoc = await Activity.findById(activityId).lean();
  if (!activityDoc) {
    console.log(`Activity ${activityId} not found in database`);
  } else {
    const activity = _cloneDeep(activityDoc);

    console.log(
      `Activity ${activityId} as stored in database:
${stringifyActivity(activity)}
----------------------`,
    );
  }

  if (!shouldFetch) {
    console.log('Skipped calculating from new Strava API request.');
    return;
  }

  const athleteDoc = await Athlete.findById(athleteId);
  if (!activityDoc) {
    console.log(`Athlete ${athleteId} not found in database`);
    return;
  }
  console.log(`Fetching activity ${activityId} from Strava API:`);

  const rawActivityData = await fetchActivity(activityId, athleteDoc);
  const transformed = transformActivity(rawActivityData);
  console.log(`${stringifyActivity(transformed)}
----------------------
*Segment efforts displayed as ID only*
`);
}

async function setupThenCommand(args) {
  await setupConnection(args, doCommand);
}

module.exports = {
  setupThenCommand,
};
