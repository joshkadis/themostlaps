const { scheduleJob } = require('node-schedule');
const { refreshSchedule } = require('../config');
const Athlete = require('../schema/Athlete');
const refreshAthleteActivities = require('./refreshAthlete');
const { timePartString } = require('./dateTimeUtils');
const refreshAthleteProfile = require('./refreshAthlete/refreshAthleteProfile');

/**
 * Query athletes collection then refresh since last_updated
 *
 * @param {Bool} shouldRefreshActivities Default to false, i.e. update profile
 * @param {Multiple} findArgs Args to pass to http://mongoosejs.com/docs/api.html#find_find
 */
async function refreshAthletes(shouldRefreshActivities = false, findArgs = [{}]) {
  const athletes = await Athlete.find(...findArgs);
  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    const updatedAthlete = await refreshAthleteProfile(athlete);
    if (updatedAthlete && shouldRefreshActivities) {
      await refreshAthleteActivities(
        updatedAthlete,
        false,
        process.env.SHOULD_REFRESH_VERBOSE
      );
    }
  }
  console.log(`Updated ${athletes.length} athletes`);
}

/**
 * Nightly refresh of activities and stats
 */
async function scheduleNightlyRefresh() {
  console.log(`Scheduling refresh for ${timePartString(refreshSchedule.hour)}h${timePartString(refreshSchedule.minute)} GMT`)
  const job = scheduleJob(refreshSchedule, async () => {
    console.log('Refreshing athletes and stats');
    await refreshAthletes();
  });
}

module.exports = {
  scheduleNightlyRefresh,
  refreshAthletes,
};
