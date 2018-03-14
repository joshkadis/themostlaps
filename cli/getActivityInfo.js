const Athlete = require('../schema/Athlete');
const fetchLapsFromActivities = require('../utils/refreshAthlete/fetchLapsFromActivities');

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

  console.log(JSON.stringify(activityInfo[0], null, 4));
  process.exit(0);
}

module.exports = getActivityInfo;
