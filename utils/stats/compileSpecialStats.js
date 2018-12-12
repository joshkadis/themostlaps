const { stringify } = require('querystring');
const fetch = require('isomorphic-unfetch');
const Condition = require('../../schema/Condition');
const {
  timezoneOffset,
  conditionPadding,
  parkCenter,
  darkSkyRequestOpts,
  coldLapsPoints,
} = require('../../config');
const { isTestUser } = require('../athleteUtils');
const { slackError } = require('../slackNotification');

/**
 * Update athlete special stats data from new activity
 *
 * @param {Activity} activity document
 * @param {String} activityDateStr ISO string of activity local start time
 * @param {Object} stats Existing stats, may be empty object
 * @return {Object} Updated stats object
 */
async function compileSpecialStats(activity, activityDateStr, stats = {}) {
  const activityLaps = activity.get('laps');

  let activityColdLaps = 0;
  const startDateObj = new Date(activityDateStr);
  if (
    startDateObj.valueOf() > (1000 * coldLapsPoints.startTimestamp)
  ) {
    try {
      activityColdLaps = await getColdLapsFromActivity(activity, true);
      activity.set('coldLapsPoints', activityColdLaps);
      await activity.save();
    } catch (err) {
      console.log(err);
      slackError(114, `getColdLapsFromActivity(${activity.get('_id')}) failed; see server log`);
    }
  }

  return Object.assign({}, stats, {
    giro2018: compileGiro2018(activityLaps, activityDateStr, stats.giro2018 || 0),
    cold2019: (stats.cold2019 || 0) + activityColdLaps,
  });
}

const darkSkyApiUrl = (timestamp) =>
  `https://api.darksky.net/forecast/${process.env.DARK_SKY_API_KEY}/${parkCenter.latitude},${parkCenter.longitude},${timestamp}?${stringify(darkSkyRequestOpts)}`;


/**
 * Get temperature from database or fall back to DarkSky API
 *
 * @param {Int} timestamp
 * @param {Int} activityId
 * @return {Object|null}
 */
async function getConditionsForTimestamp(timestamp, activityId) {
  const condition = await Condition.findOne({ time: {
    $gte: (timestamp - conditionPadding),
    $lte: (timestamp + conditionPadding),
  }});

  if (condition) {
    return condition.toJSON();
  }

  // If condition not found in database, query DarkSky API
  let response;
  try {
    response = await fetch(darkSkyApiUrl(timestamp));
  } catch (err) {
    slackError(115, darkSkyApiUrl(timestamp));
    return null;
  }

  if (200 !== response.status) {
    return null;
  }

  let weatherData;
  const resJson = await response.json();
  try {
    weatherData = resJson.currently;

    let sunriseTime = null;
    let sunsetTime = null;
    try {
      sunriseTime = resJson.daily.data[0].sunriseTime;
      sunsetTime = resJson.daily.data[0].sunsetTime;
    } catch (err) {
      console.log(err);
    }

    const newCondition = await Condition.create({
      apparentTemperature: typeof weatherData.apparentTemperature !== 'undefined' ?
        weatherData.apparentTemperature : null,
      humidity: typeof weatherData.humidity !== 'undefined' ?
        weatherData.humidity : null,
      icon: weatherData.icon || null,
      precipIntensity: typeof weatherData.precipIntensity !== 'undefined' ?
        weatherData.precipIntensity : null,
      precipType: weatherData.precipType || null,
      sourceActivity: activityId,
      summary: weatherData.summary || null,
      sunriseTime,
      sunsetTime,
      temperature: weatherData.temperature,
      time: weatherData.time,
      windSpeed: typeof weatherData.windSpeed !== 'undefined' ?
        weatherData.windSpeed : null,
      windGust: typeof weatherData.windGust !== 'undefined' ?
        weatherData.windGust : null,
    });
    return newCondition.toJSON();
  } catch (err) {
    slackError(116, JSON.stringify(resJson, null, 2));
    return null;
  }
}

/**
 * Calculate points from conditions object
 *
 * @param {Object} conditions
 * @return {Int}
 */
function getColdLapsPointsFromConditions(conditions) {
  let points = 0;
  const {
    apparentTemperature = null,
    precipType = null,
  } = conditions;

  // Assumes points are in descending order by temp
  if (apparentTemperature !== null) {
    const tempPoints = coldLapsPoints.tempPoints.reduce((acc, [_temp, _points]) => {
      if (apparentTemperature <= _temp) {
        return _points;
      }
      return acc;
    }, 0);
    points = points + tempPoints;
  }

  if (precipType && coldLapsPoints.precipPoints[precipType]) {
    points = points + coldLapsPoints.precipPoints[precipType];
  }

  return points;
}

function timestampFromLocalDateString(localDateStr) {
  const theDate = new Date(localDateStr);
  return (theDate.valueOf() / 1000) + (timezoneOffset * 60);
}

/**
 * Calculate laps below threshold temperature
 *
 * @param {Activity} activity
 * @return {Int}
 */
async function getColdLapsFromActivity(activity, debug = false) {
  const activityLaps = activity.get('laps');
  const segmentEfforts = activity.get('segment_efforts');

  // Get array of timestamps to check
  let lapStartTimestamps = segmentEfforts.map(({ start_date_local }) =>
    timestampFromLocalDateString(start_date_local));

  // Fudge extra timestamps for any laps not included in segment efforts
  if (segmentEfforts.length && activityLaps > segmentEfforts.length) {
    const totalMovingTime = segmentEfforts
      .reduce((acc, { moving_time }) => (acc + moving_time), 0);
    const extraLaps = activityLaps - segmentEfforts.length;
    const avgLapTime = Math.floor(totalMovingTime / segmentEfforts.length);

    // Each extra lap is 1 average lap earlier than the first segment
    for (let i = 1; i <= extraLaps; i++) {
      const extraLapTimestamp = lapStartTimestamps[0] - avgLapTime;
      lapStartTimestamps = [extraLapTimestamp, ...lapStartTimestamps];
    }
  } else if (activityLaps > 0) {
    // Handle if activity has laps but no segment efforts
    lapStartTimestamps = Array(activityLaps)
      .fill(timestampFromLocalDateString(activity.get('start_date_local')));
  }

  let coldLaps = 0;
  for (let i = 0; i < lapStartTimestamps.length; i++) {
    const conditions = await getConditionsForTimestamp(lapStartTimestamps[i], activity.get('_id'));
    if (conditions !== null) {
      if (debug && conditions.apparentTemperature) {
        console.log(`Lap ${i + 1}: ${conditions.apparentTemperature.toFixed(2)}º, ${conditions.precipType || 'no precipitation'}`);
      }
      coldLaps = coldLaps + getColdLapsPointsFromConditions(conditions);
    } else if (debug) {
      console.log(`Lap ${i + 1}: could not find apparentTemperature`);
    }
  }

  if (debug) {
    console.log(`${coldLaps} Cold Laps point${coldLaps === 1 ? '' : 's'}`)
  }

  return coldLaps;
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
