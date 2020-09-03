const moment = require('moment');
const geolib = require('geolib');
const { locations } = require('../../../config');

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


const getNearestWaypointIdx = (point, waypoints) => {
  const nearest = geolib.findNearest(point, waypoints);
  return Number.parseInt(nearest.key, 10);
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
  {
    latlng, distance, time,
  },
  locName,
  activity,
) {
  // add coordinates formatted for geolib
  const geoCoords = latlng.map(([lat, lon]) => ({ lat, lon }));

  const location = locations[locName] || null;
  if (!location || !location.waypoints) {
    return null;
  }
  const {
    waypoints,
  } = location;

  const inferSegmentEffort = (start, end) => makeInferredSegmentEffort(start, end, time);
  const nearestWaypointIdx = (point) => getNearestWaypointIdx(point, waypoints);

  // loop through latlng stream
  // near first waypoint
  // set up orderedWaypoints accordingly
  // count lap when reached last in orderedWaypoints
  // *time* lap when reached first in orderedWaypoints
  // shift from orderedWaypoints
  let numLaps = 0;
  const segmentEfforts = [];
  let orderedWaypoints = [];
  let startWaypointIdx = null;
  let startLapTimeIdx = null;
  geoCoords.forEach((currPoint, currIdx) => {
    const nearestIdx = nearestWaypointIdx(currPoint);
    if (nearestIdx === -1) {
      return;
    }

    // Let's set up to track a new lap
    if (orderedWaypoints.length === 0) {
      // If we're finishing a lap, make a segment effort
      if (numLaps > 0) {
        segmentEfforts.push(
          inferSegmentEffort(startLapTimeIdx, currIdx),
        );
      }
      startLapTimeIdx = currIdx;
      startWaypointIdx = nearestIdx;
      orderedWaypoints = waypoints.slice(nearestIdx)
        .concat(waypoints.slice(0, nearestIdx));
    }

    // If we're in the middle of a lap
    if (nearestIdx === orderedWaypoints[0]) {
      // If this is the last remaining waypoint,
      // count a lap to account for exiting between waypoints
      if (orderedWaypoints.length === 1) {
        numLaps += 1;
      }
      // get ready for next waypoint
      orderedWaypoints.shift();
    }

    // @todo handle out-of-order waypoints
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
};
