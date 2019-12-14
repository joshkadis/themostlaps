/* eslint-disable no-await-in-loop, no-underscore-dangle */
const { scheduleJob } = require('node-schedule');
const { refreshSchedule } = require('../config');
const Athlete = require('../schema/Athlete');
const refreshAthleteActivities = require('./refreshAthlete');
const { timePartString } = require('./dateTimeUtils');
const refreshAthleteProfile = require('./refreshAthlete/refreshAthleteProfile');
const { daysAgoTimestamp } = require('../cli/utils');
/**
 * Query athletes collection then refresh since last_updated
 *
 * @param {Bool} shouldRefreshActivities Default to false, i.e. update profile
 * @param {Multiple} findArgs Args to pass to http://mongoosejs.com/docs/api.html#find_find
 */
async function refreshAthletes(
  shouldRefreshActivities = false,
  findArgs = [{}],
) {
  const athletes = await Athlete.find(...findArgs);
  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    const updatedAthlete = await refreshAthleteProfile(athlete);
    /* TEMP CODE */
    try {
      // Be cautious since going straight to production...
      if (
        typeof athlete.get('stats._2019') === 'number'
        && athlete.get('stats._2019') > 0
      ) {
        await refreshAthleteActivities(
          athlete,
          daysAgoTimestamp(15),
          true,
        );
      }
    } catch (err) {
      const identifier = `${athlete.id} | ${athlete.get('athlete.firstname')} ${athlete.get('athlete.lastname')}`;
      console.log(`refreshAthleteActivities failed | ${identifier}`);
    }
    /* /TEMP CODE */
    // if (updatedAthlete && shouldRefreshActivities) {
    //   await refreshAthleteActivities(
    //     updatedAthlete,
    //     false,
    //     process.env.SHOULD_REFRESH_VERBOSE
    //   );
    // }
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
