const fetch = require('isomorphic-unfetch');
const { getDistance } = require('geolib');
const {
  apiUrl,
  minDistance,
  allowedRadius,
  parkCenter,
  lapSegmentId,
} = require('../../config');
const { formatSegmentEffort } = require('../athleteHistory');
const calculateLapsFromSegmentEfforts = require('./calculateLapsFromSegmentEfforts');

/**
 * Get distance of [lat,lng] point from park center
 *
 * @param {Array} latlng
 * @return {Number}
 */
function distFromParkCenter(latlng = null) {
  if (!latlng || 2 !== latlng.length) {
    return null;
  }

  return getDistance(
    parkCenter,
    {
      latitude: latlng[0],
      longitude: latlng[1],
    },
    100,
    1
  );
}

/**
 * Fetch single activity from Strava API
 *
 * @param {Number} activityId
 * @param {String} token
 * @return {Object}
 */
async function fetchActivity(activityId, token) {
  const response = await fetch(`${apiUrl}/activities/${activityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const activity = await response.json();
  return activity;
}

/**
 * Check if activity is eligible to maybe have laps
 *
 * @param {Object} activity
 * @param {Bool} verbose
 * @return {Bool}
 */
function activityCouldHaveLaps(activity, verbose = false) {
   const {
    id = 0,
    type = 'unknown',
    trainer = false,
    manual = false,
    start_latlng = null,
    end_latlng = null,
    distance = 0,
  } = activity;

  if ('string' === typeof type && type.toLowerCase() !== 'ride') {
    if (verbose) {
      console.log(`Activity ${id} is not a Ride.`);
    }
    return false;
  }

  if (manual || trainer || distance < minDistance) {
    if (verbose) {
      let reason;
      switch (true) {
        case !!manual:
          reason = 'a manual activity';
          break;

        case !!trainer:
          reason = 'a trainer activity';
          break;

        case !!(distance < minDistance):
          reason = 'less than the min distance';
          break;

        default:
          reason = 'invalid';
      }
      console.log(`Activity ${id} is ${reason}.`);
    }
    return false;
  }

  const nearParkCenter =
    (start_latlng && distFromParkCenter(start_latlng) < allowedRadius) ||
    (end_latlng && distFromParkCenter(end_latlng) < allowedRadius);

  if (verbose && !nearParkCenter) {
      console.log(`Activity ${id} is not near the park center.`);
  }

  return nearParkCenter;
}

/**
 * Filter segment efforts for activity
 *
 * @param {Array} efforts
 * @return {Array}
 */
function filterSegmentEfforts(efforts) {
  return efforts
    .filter(({ segment }) => lapSegmentId === segment.id)
    .map((effort) => formatSegmentEffort(effort));
}

/**
 * Get laps data object from an activity
 *
 * @param {Object} activity
 * @param {Boolean} verbose Defaults to false
 * @return {Object|false}
 */
function getActivityData(activity, verbose = false) {
  const {
    id,
    athlete,
    segment_efforts = [],
    start_date_local,
  } = activity;

  const laps = segment_efforts.length ?
    calculateLapsFromSegmentEfforts(segment_efforts) : 0;

  if (verbose) {
    console.log(`Activity ${id} has ${laps} laps`);
  }

  if (!laps) {
    return false;
  }

  const added = new Date();
  return {
    _id: id,
    added_date: added.toISOString(),
    athlete_id: athlete.id,
    laps,
    segment_efforts: filterSegmentEfforts(segment_efforts),
    source: 'refresh',
    start_date_local,
  };
}

module.exports = {
  fetchActivity,
  activityCouldHaveLaps,
  getActivityData,
};
