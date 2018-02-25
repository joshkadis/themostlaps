const { scheduleJob } = require('node-schedule');
const { refreshSchedule } = require('../config');
const Athlete = require('../schema/Athlete');
const refreshAthlete = require('../utils/refreshAthlete');

/**
 * Convert int to min. 2-digit string for logging
 */
const timePart = (part) => {
  if (part >= 10) {
    return part.toString();
  }
  return `0${part}`;
};

/**
 * Nightly refresh of activities and stats
 */
async function scheduleNightlyRefresh() {
  console.log(`Scheduling refresh for ${timePart(refreshSchedule.hour)}h${timePart(refreshSchedule.minute)}`)
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
