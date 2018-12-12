const Athlete = require('../schema/Athlete');
const Activity = require('../schema/Activity');
const fetchLapsFromActivities = require('../utils/refreshAthlete/fetchLapsFromActivities');
const { getColdLapsFromActivity } = require('../utils/stats/compileSpecialStats');

async function getActivityInfo(userId, activityId) {
  const athleteDoc = await Athlete.findById(userId, 'access_token');
  if (!athleteDoc) {
    console.log('Athete not found');
    process.exit(0);
  }

  const activityInfo = await fetchLapsFromActivities(
    [activityId],
    athleteDoc.get('access_token'),
    true
  );

  const activityDoc = await Activity.findById(activityId);
  if (activityDoc) {
    const coldLapsPoints = await getColdLapsFromActivity(activityDoc, true);
    activityInfo.coldLapsPoints = coldLapsPoints;
  }

  console.log(JSON.stringify(activityInfo[0], null, 4));
  process.exit(0);
}

module.exports = getActivityInfo;
