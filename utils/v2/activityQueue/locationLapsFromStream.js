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
const getNearestWaypointIdx = (
  point,
  waypoints,
  padding = WAYPOINT_PADDING,
) => {
  const nearest = geolib.findNearest(point, waypoints);
  return nearest.distance <= padding
    ? Number(nearest.key)
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
  // eslint-disable-next-line no-unused-vars
  [latlng, distance, time],
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

  // The order of waypoints that defines a lap and
  // the current start/finish point for timing
  // Definition will tick off as rider reaches waypoints
  // or rest if they cut through the middle
  let numLaps = -1;
  const segmentEfforts = [];
  let startLapTimerIdx = -1;
  let remainingWaypoints = [];
  let lastHandledWaypoint = -1;
  let segmentEffortStartFinish = -1;

  const resetLap = (waypointIdx, streamPoint, streamIdx) => {
    const prevWaypoint = waypointIdx > 0
      ? waypoints[waypointIdx - 1]
      : waypoints[waypoints.length - 1];

    const nextWaypoint = (waypointIdx + 1) < waypoints.length
      ? waypoints[waypointIdx + 1]
      : waypoints[0];

    // Is streamPoint close to next waypoint or prev waypoint?
    // If prev, count lap from waypointIdx
    // If next, count lap from next waypoint
    const closerWaypoint = geolib.findNearest(
      streamPoint,
      [prevWaypoint, nextWaypoint],
    );
    const startLapFromWaypoint = waypointIdx + closerWaypoint;

    const indices = Object.keys(waypoints);
    remainingWaypoints = indices
      .slice(startLapFromWaypoint)
      .concat(waypoints.slice(0, startLapFromWaypoint))
      .map((key) => Number(key));
    segmentEffortStartFinish = remainingWaypoints.shift();
    startLapTimerIdx = streamIdx;
  };

  const recordSegmentEffort = (start, end) => {
    segmentEfforts.push(inferSegmentEffort(start, end));
  };

  const incrementCounter = () => {
    numLaps += 1;
  };

  geoCoords.forEach((currPoint, currIdx) => {
    const nearestIdx = nearestWaypointIdx(currPoint);
    // Ignore if we're not near a waypoint
    // or if near on the same waypoint
    if (nearestIdx === -1 || nearestIdx === lastHandledWaypoint) {
      return;
    }
    // Mark that we're handling a new waypoint
    lastHandledWaypoint = nearestIdx;

    // Start tracking a lap
    if (remainingWaypoints.length === 0) {
      console.log(`starting a new lap, nearestIdx: ${nearestIdx}`);
      // Record a segment effort
      // except on the start of the first lap
      if (nearestIdx === segmentEffortStartFinish) {
        recordSegmentEffort(startLapTimerIdx, currIdx);
        console.log('recorded segment effort', segmentEfforts);
      }
      resetLap(nearestIdx, currPoint, currIdx);
      console.log('reset lap', remainingWaypoints);
      return;
    }

    // Reaching the next point in a lap
    if (nearestIdx === remainingWaypoints[0]) {
      // remove from remaining waypoints
      remainingWaypoints.shift();
      // count lap if this was the last point
      if (remainingWaypoints.length === 0) {
        incrementCounter();
        console.log(`counted a new lap, numLaps: ${numLaps}`);
      }
      return;
    }

    // Reached waypoint out of order, reset without
    // counting a lap or segment effort
    if (remainingWaypoints.includes(nearestIdx)) {
      resetLap(nearestIdx, currPoint, currIdx);
      console.log(`reset lap from nearestIdx: ${nearestIdx}`);
    }
  });

  return {
    location: locName,
    laps: numLaps,
    segment_efforts: segmentEfforts,
  };
}

module.exports = {
  locationLapsFromStream,
  latlngToString,
  makeInferredSegmentEffort,
  getNearestWaypointIdx,
  setupOrderedWaypoints,
};
