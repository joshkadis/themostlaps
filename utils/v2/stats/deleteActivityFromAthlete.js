const _cloneDeep = require('lodash/cloneDeep');
const Athlete = require('../../../schema/Athlete');
const Activity = require('../../../schema/Activity');
const { applyActivityToLocationStats } = require('./generateStatsV2');
/**
 * Remove an activity from an athlete's stats then delete its document
 *
 * @param {Activity|Number} activity Activity document or ID
 * @param {Boolean} isDryRun Default is false, no DB updates if true
 * @returns {Athlete|Boolean} Updated Athlete document or false if error
 */
async function deleteActivityFromAthleteStats(activity, isDryRun = false) {
  let activityDoc;
  if (activity instanceof Activity) {
    activityDoc = activity;
  } else {
    activityDoc = await Activity.findById(activity);
  }
  // Action complete if we can't find the activity in the first place
  if (!activityDoc) {
    console.log(`Could not find Activity ${activity}`);
    return false;
  }

  const athleteDoc = await Athlete.findById(activityDoc.athlete_id);
  if (!athleteDoc) {
    console.log(`Could not find Athlete ${activityDoc.athlete_id} for Activity ${activityDoc.id}`);
    return false;
  }

  if (!athleteDoc.stats.locations || athleteDoc.stats_version !== 'v2') {
    console.log(`Athlete ${activityDoc.athlete_id} does not have v2 stats format`);
    return false;
  }
  const athleteLocationsStats = _cloneDeep(athleteDoc.stats.locations);

  const {
    start_date_local,
    startDateUtc = false,
    laps,
    location,
    allLocations = [],
  } = activityDoc;

  // Create array of stubbed activities to remove from Athlete's stats
  let stubActivities = allLocations.length
    ? _cloneDeep(allLocations)
    : [{ // if allLocations not set up, mock with top-level activity stats
      laps,
      location,
    }];
  stubActivities = stubActivities.map((loc) => ({
    ...loc,
    laps: (loc.laps * -1),
    start_date_local,
    startDateUtc,
  }));

  stubActivities.reduce((acc, stub) => {
    // Must have stats and be removing laps
    if (acc[stub.location] && stub.laps < 0) {
      acc[stub.location] = applyActivityToLocationStats(
        stub,
        _cloneDeep(acc[stub.location]),
      );
    }
    return acc;
  }, athleteLocationsStats);

  athleteDoc.set('stats', {
    ...athleteDoc.stats,
    locations: athleteLocationsStats,
  });

  athleteDoc.markModified('stats');
  if (!isDryRun) {
    await athleteDoc.save();
    await activityDoc.remove();
  }
  return athleteDoc;
}

module.exports = {
  deleteActivityFromAthleteStats,
};
