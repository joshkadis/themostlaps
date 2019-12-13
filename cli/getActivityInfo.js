const Athlete = require('../schema/Athlete');
const Activity = require('../schema/Activity');
const { getColdLapsFromActivity } = require('../utils/stats/compileSpecialStats');
const { fetchActivity, getActivityData } = require('../utils/refreshAthlete/utils');

async function getActivityInfo(userId, activityId, fetch) {
  const athleteDoc = await Athlete.findById(userId, 'access_token');
  if (!athleteDoc) {
    console.log('Athete not found');
    process.exit(0);
  }

  if (fetch) {
    console.log('Fetching from Strava API, will not calculate cold laps points');
    const activityResult = await fetchActivity(activityId, athleteDoc);
    if (
      activityResult.segment_efforts
      && activityResult.segment_efforts.length
    ) {
      console.log(getActivityData(activityResult));
    } else {
      console.log(`Activity ${activityId} is missing segment_efforts`);
    }
    process.exit(0);
  }

  const activityDoc = await Activity.findById(activityId);
  if (!activityDoc) {
    console.log('Activity not found');
    process.exit(0);
  }

  const coldLapsPoints = await getColdLapsFromActivity(activityDoc, true);

  console.log({
    ...activityDoc.toJSON(),
    coldLapsPoints,
  });
  process.exit(0);
}

module.exports = getActivityInfo;
