const { scheduleJob } = require('node-schedule');
const { refreshSchedule } = require('../config');
const Athlete = require('../schema/Athlete');
const refreshAthlete = require('../utils/refreshAthlete');
const { timePartString } = require('./dateTimeUtils');

/**
 * Nightly refresh of activities and stats
 */
async function scheduleNightlyRefresh() {
  console.log(`Scheduling refresh for ${timePartString(refreshSchedule.hour)}h${timePartString(refreshSchedule.minute)} GMT`)
  const job = scheduleJob(refreshSchedule, async () => {
    console.log('Refreshing athletes and stats');
    const athletes = await Athlete.find({});
    for (let i = 0; i < athletes.length; i++) {
      const athlete = athletes[i];
      await refreshAthlete(athlete);
    }
    console.log(`Updated ${athletes.length} athletes`);
  });
}

module.exports = scheduleNightlyRefresh;
