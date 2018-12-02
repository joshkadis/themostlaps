const { stringify } = require('querystring');
const fetch = require('isomorphic-unfetch');
const Condition = require('../schema/Condition');
const {
  timezoneOffset,
  conditionPadding,
  parkCenter,
  darkSkyRequestOpts
} = require('../config');
const { slackError } = require('../slackNotifications');

/**
 * Update athlete special stats data from new activity
 *
 * @param {Activity} activity document
 * @param {String} activityDateStr ISO string of activity local start time
 * @param {Object} stats Existing stats, may be empty object
 * @return {Object} Updated stats object
 */
function compileSpecialStats(activity, activityDateStr, stats = {}) {
  const activityLaps = activity.get('laps');
  return Object.assign({}, stats, {
    giro2018: compileGiro2018(activityLaps, activityDateStr, stats.giro2018 || 0),
    cold2019: (stats.cold2019 || 0) + getColdLapsFromActivity(activity, activityDateStr),
  });
}

const darkSkyApiUrl = (timestamp) =>
  `https://api.darksky.net/forecast/${process.env.DARK_SKY_API_KEY}/${parkCenter.latitude},${parkCenter.longitude},${timestamp}?${stringify(darkSkyRequestOpts)}`;


/**
 * Get temperature from database or fall back to DarkSky API
 *
 * @param {Int} timestamp
 * @return {Int}
 */
async function getTempFromTimestamp(timestamp) {
  const condition = await Condition.findOne({ time: {
    $gte: (timestamp - conditionPadding),
    $lte: (timestamp + conditionPadding),
  }});

  if (condition) {
    return condition.get('temperature');
  }

  // If condition not found in database, query DarkSky API
  try {
    const response = await fetch(darkSkyApiUrl(timestamp));
  } catch (err) {
    slackError(115, darkSkyApiUrl(timestamp));
    return null;
  }

  if (200 !== response.status) {
    return null;
  }

  let weatherData;
  try {
    weatherData = await response.json().currently;
    await Condition.create({
      apparentTemperature: typeof weatherData.apparentTemperature !== 'undefined' ?
        weatherData.apparentTemperature : null,
      humidity: typeof weatherData.humidity !== 'undefined' ?
        weatherData.humidity : null,
      icon: weatherData.icon || null,
      precipIntensity: typeof weatherData.precipIntensity !== 'undefined' ?
        weatherData.precipIntensity : null,
      precipType: weatherData.precipType || null,
      summary: weatherData.summary || null,
      temperature: weatherData.temperature,
      time: weatherData.time,
      windSpeed: typeof weatherData.windSpeed !== 'undefined' ?
        weatherData.windSpeed : null,
      windGust: typeof weatherData.windGust !== 'undefined' ?
        weatherData.windGust : null,
    });
  } catch (err) {
    slackError(116, JSON.stringify(response.json()));
    return null;
  }

  return weatherData.temperature;
}

/**
 * Calculate laps below threshold temperature
 *
 * @param {Activity} activity
 * @param {String} activityDateStr ISO string of activity local start time
 * @return {Int}
 */
async function getColdLapsFromActivity(activity, activityDateStr) {
  const activityLaps = activity.get('laps');
  const segmentEfforts = activity.get('segment_efforts');
  const timeOffset = timezoneOffset * -60;

  // Get array of timestamps to check
  let lapStartTimestamps = segmentEfforts.map(({ start_date_local }) => {
    const effortDate = new Date(start_date_local);
    return (effortDate.valueOf() / 1000) + timeOffset;
  });

  // Fudge extra timestamps for any laps not included in segment efforts
  if (activityLaps > segmentEfforts.length) {
    const totalMovingTime = segmentEfforts
      .reduce((acc, { moving_time }) => (acc + moving_time), 0);
    const extraLaps = activityLaps - segmentEfforts.length;
    const avgLapTime = totalMovingTime / segmentEfforts.length;

    // Each extra lap is 1 average lap earlier than the first segment
    for (let i = 1; i <= extraLaps; i++) {
      const extraLapTimestamp = lapStartTimestamps[0] - avgLapTime;
      lapStartTimestamps = [extraLapTimestamp, ...lapStartTimestamps];
    }
  }

  lapStartTimestamps.forEach((timestamp) => console.log(getTempFromTimestamp(timestamp)));
}

/**
 * Update Giro 2018 from new activity
 *
 * @param {Number} laps
 * @param {String} activityDateStr ISO string of activity local start time
 * @param {Number} currentTotal Existing Giro 2018 total, may be 0
 * @return {Number} Updated Giro 2018 total
 */
function compileGiro2018(laps, activityDateStr, currentTotal) {
  const matches = /^(\d{4,4})-(\d{2,2})-(\d{2,2})/.exec(activityDateStr);

  if (!matches) {
    return currentTotal;
  }

  const activityDay = parseInt(matches[3], 10);

  // Giro runs from May 4-27 w 3 rest days
  if (
    matches[1] == '2018' &&
    matches[2] == '05' &&
    activityDay >= 4 &&
    activityDay <= 27 &&
    activityDay !== 7 &&
    activityDay !== 14 &&
    activityDay !== 21
  ) {
    return currentTotal + laps;
  }

  return currentTotal;
}

module.exports = {
  compileSpecialStats,
  compileGiro2018,
  getColdLapsFromActivity,
};
