const { scheduleJob } = require('node-schedule');
const { refreshSchedule } = require('../config');
const Athlete = require('../schema/Athlete');
const refreshAthlete = require('../utils/refreshAthlete');
const { timePartString } = require('./dateTimeUtils');

/**
 * Query athletes collection then refresh since last_updated
 *
 * @param {Multiple} args to pass to http://mongoosejs.com/docs/api.html#find_find
 */
async function refreshAthletes(...args) {
  const athletes = await Athlete.find(...args);
  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    await refreshAthlete(athlete);
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
    await refreshAthletes({});
  });
}

module.exports = {
  scheduleNightlyRefresh,
  refreshAthletes,
};
