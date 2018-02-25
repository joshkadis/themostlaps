const { scheduleJob } = require('node-schedule');
const { refreshSchedule } = require('../config');
const Athlete = require('../schema/Athlete');
const refreshAthlete = require('../utils/refreshAthlete');

/**
 * Nightly refresh of activities and stats
 */
async function scheduleNightlyRefresh() {
  const job = scheduleJob(refreshSchedule, async () => {
    const athletes = await Athlete.find({});
    for (let i = 0; i < athletes.length; i++) {
      const athlete = athletes[i];
      await refreshAthlete(athlete);
    }
    console.log(`Updated ${athletes.length} athletes`);
  });
}

module.exports = scheduleNightlyRefresh;
