const Athlete = require('../schema/Athlete');
const Activity = require('../schema/Activity');
const fetchLapsFromActivities = require('../utils/refreshAthlete/fetchLapsFromActivities');
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
    console.log(getActivityData(activityResult));
    process.exit(0);
  }

  const activityDoc = await Activity.findById(activityId);
  if (!activityDoc) {
    console.log('Activity not found');
    process.exit(0);
  }

  const coldLapsPoints = await getColdLapsFromActivity(activityDoc, true);

  console.log(Object.assign({}, activityDoc.toJSON(), { coldLapsPoints }));
  process.exit(0);
}

module.exports = getActivityInfo;
