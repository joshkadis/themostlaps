const moment = require('moment');
const geolib = require('geolib');
const { locations } = require('../../../config');

const WAYPOINT_PADDING = 50;

/**
 * Set up array of waypoints starting with specific index
 * and looping back to match expected length
 *
 * @param {Number} startIdx
 * @param {Number} length
 * @returns {Array}
 */
const setupOrderedWaypoints = (startIdx, length) => {
  const forCount = [];

  for (let curr = startIdx; forCount.length < length; curr += 1) {
    if (curr === length) {
      curr = 0;
    }
    forCount.push(curr);
  }
  const forTime = [...forCount];
  forTime.push(forTime.shift());
  forCount.shift();

  return {
    forTime,
    forCount,
  };
};

/**
 * Take a coordinate object in various format and return a csv string
 * useful for finding index of coordinate in an array of coordinates
 *
 * @param {Object|Array} src
 * @returns str
 */
const latlngToString = ({
  lat = '',
  latitude = '',
  lon = '',
  lng = '',
  longitude = '',
}) => `${lat || latitude},${lon || lng || longitude}`;

/**
 * Get object formatted for SegmentEffort schema from start and end
 * within an array of timestamps
 *
 * @param {Number} startIdx Index of lap start in array of times
 * @param {Number} endIdx Index of lap end in array of times
 * @param {Array} times Array of times
 * @param {Object} activity Strava API activity response
 * @returns {Object}
 */
const makeInferredSegmentEffort = (
  startIdx,
  endIdx,
  times,
  { start_date_local, start_date },
) => {
  // Original string type in schema
  const adjustedLocal = moment(start_date_local)
    .add(times[startIdx], 'seconds')
    .toISOString()
    .replace(/\.\d+Z$/, 'Z'); // Strava doesn't provide fraction of second

  // Newer date type in schema
  const adjustedUtc = moment(start_date)
    .add(times[startIdx], 'seconds')
    .toDate();

  return {
    elapsed_time: times[endIdx] - times[startIdx],
    moving_time: null, // can only get elapsed time reliably
    start_date_local: adjustedLocal,
    startDateUtc: adjustedUtc,
    fromStream: true,
  };
};

/**
 * Get closest waypoint to a given point within an allowed padding
 *
 * @param {Object} point lat/lon object
 * @param {Array} waypoints array of lat/lon objects
 * @param {Number} padding max distance from initial point to waypoint
 * @returns {Number} Index of nearest waypoint or -1 if not within padding
 */
const getNearestWaypointIdx = (point, waypoints, padding = WAYPOINT_PADDING) => {
  const nearest = geolib.findNearest(point, waypoints);
  return nearest.distance <= padding
    ? Number.parseInt(nearest.key, 10)
    : -1;
};

/**
 * Use activity stream to calculate laps
 *
 * @param {Object} streams Streams data
 * @param {String} locName Location name
 * @param {Object} activity Activity data from Strava API response
 * @returns {ActivityLocation} See schema/Activity.js
 */
function locationLapsFromStream(
  [
    latlng, distance, time,
  ],
  locName,
  activity,
) {
  // add coordinates formatted for geolib
  const geoCoords = latlng.data.map(([lat, lon]) => ({ lat, lon }));

  const location = locations[locName] || null;
  if (!location || !location.waypoints) {
    return null;
  }
  const {
    waypoints,
  } = location;

  const inferSegmentEffort = (start, end) => makeInferredSegmentEffort(
    start,
    end,
    time.data,
    activity,
  );
  const nearestWaypointIdx = (point) => getNearestWaypointIdx(point, waypoints);

  // loop through latlng stream
  // near first waypoint
  // set up orderedWaypoints accordingly
  // count lap when reached last in orderedWaypoints
  // *time* lap when reached first in orderedWaypoints
  // shift from orderedWaypoints
  let numLaps = 0;
  const segmentEfforts = [];
  let startLapTimeIdx = null;
  let endLapTimeIdx = null;
  let lapCounter = [];
  let lapTimer = [];
  let lastIdx = -1;
  geoCoords.forEach((currPoint, currIdx) => {
    const nearestIdx = nearestWaypointIdx(currPoint);
    if (nearestIdx === -1) {
      return;
    }

    // if (lastIdx !== nearestIdx) {
    //   console.log(nearestIdx);
    // }
    if (lastIdx !== nearestIdx) {
      console.log(lastIdx);
    }
    lastIdx = nearestIdx;

    const { forTime, forCount } = setupOrderedWaypoints(nearestIdx, waypoints.length);

    // handle lap counting
    if (lapCounter.length === 0) {
      // set up lap counter
      lapCounter = [...forCount];
    } else if (lapCounter.length === 1 && nearestIdx === lapCounter[0]) {
      // if we've reached the last waypoint for this lap
      // count a lap
      numLaps += 1;
      // reset counter
      lapCounter = [];
    } else if (nearestIdx === lapCounter[1]) {
      // if we've reached the next waypoint
      // remove it frome the counter
      lapCounter.splice(1, 1);
    }
    // set up a new lap timer
    // if (lapTimer.length === 0) {
    //   lapTimer = [...forTime];
    // } else if (nearestIdx === lapTimer[0]) {
    //   if (startLapTimeIdx !== null) {

    //   }

    // }
  });

  return {
    // location: locName,
    laps: numLaps,
    // segment_efforts: segmentEfforts,
  };
}

module.exports = {
  locationLapsFromStream,
  latlngToString,
  makeInferredSegmentEffort,
  getNearestWaypointIdx,
  setupOrderedWaypoints,
};
