const { locations } = require('../../../config');

const makeInferredSegmentEffort = (start, end, time) => ({
  elapsed_time: time[end] - time[start],
  moving_time: -1, // can only get elapsed time reliably
  start_date_local: new Date(start), // @todo
  startDateUtc: new Date(start),
  fromStream: true,
});

/**
 * Use activity stream to calculate laps
 *
 * @param {Object} streams Streams data
 * @param {String} locName Location name
 * @returns {ActivityLocation} See schema/Activity.js
 */
function locationLapsFromStream(
  { latlng, distance, time },
  locName,
) {
  const inferSegmentEffort = (start, end) => makeInferredSegmentEffort(start, end, time);

  const location = locations[locName] || null;
  if (!location || !location.waypoints) {
    return null;
  }
  const {
    waypoints,
  } = location;
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
  latlng.forEach((currPoint, currIdx) => {
    const nearestIdx = nearestWaypointIdx(currPoint, waypoints);
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
};
