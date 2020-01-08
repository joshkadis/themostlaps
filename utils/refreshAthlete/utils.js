const { getDistance } = require('geolib');
const {
  minDistance,
  allowedRadius,
  parkCenter,
  lapSegmentId,
} = require('../../config');
const fetchStravaAPI = require('../fetchStravaAPI');
const { formatSegmentEffort } = require('../athleteHistory');
const calculateLapsFromSegmentEfforts = require('./calculateLapsFromSegmentEfforts');
const { slackError } = require('../slackNotification');
const Athlete = require('../../schema/Athlete');
/**
 * Get distance of [lat,lng] point from park center
 *
 * @param {Array} latlng
 * @return {Number}
 */
function distFromParkCenter(latlng = null) {
  if (!latlng || latlng.length !== 2) {
    return null;
  }

  return getDistance(
    parkCenter,
    {
      latitude: latlng[0],
      longitude: latlng[1],
    },
    100,
    1,
  );
}

/**
 * Is lat/long pair within allowedRadius?
 *
 * @param {Array} latlng
 * @return {Boolean}
 */
function isWithinAllowedRadius(latlng) {
  return latlng && distFromParkCenter(latlng) < allowedRadius;
}

/**
 * Fetch single activity from Strava API
 *
 * @param {Number} activityId
 * @param {String|Document} tokenOrDoc access_token or Athlete document
 * @return {Object|false}
 */
async function fetchActivity(activityId, tokenOrDoc, includeAllEfforts = true) {
  let athleteDoc;
  if (typeof tokenOrDoc === 'string') {
    athleteDoc = await Athlete.findOne({ access_token: tokenOrDoc });
  } else if (tokenOrDoc instanceof Athlete) {
    athleteDoc = tokenOrDoc;
  }

  if (typeof athleteDoc === 'undefined' || !athleteDoc) {
    return false;
  }

  const params = includeAllEfforts ? { include_all_efforts: true } : false;

  const response = await fetchStravaAPI(
    `/activities/${activityId}`,
    athleteDoc,
    params,
  );

  if (response.status && response.status !== 200) {
    console.log(`Error fetching activity ${activityId}`);
    slackError(45, {
      activityId,
      status: response.status,
    });
    return false;
  }

  return response;
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

  if (typeof type === 'string' && type.toLowerCase() !== 'ride') {
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

  const nearParkCenter = isWithinAllowedRadius(start_latlng)
    || isWithinAllowedRadius(end_latlng);

  if (verbose && !nearParkCenter) {
    console.log(`Activity ${id} is not near the park center.`);
  }

  return nearParkCenter;
}

/**
 * Dedupe segment efforts from JSON array
 * @todo: Test with array of SegmentEffort documents
 *
 * @param {Array} efforts
 * @return {Array} Deduped efforts
 */
function dedupeSegmentEfforts(efforts) {
  return efforts.reduce((acc, effort) => {
    // Make array of start times that have already been included
    const startTimes = acc.map(({ start_date_local }) => start_date_local);
    // Check that activity w/ this start time hasn't been included already
    if (startTimes.indexOf(effort.start_date_local) === -1) {
      acc.push(effort);
    }
    return acc;
  }, []);
}


/**
 * Filter, dedupe, and format lap segment efforts from all segment efforts
 *
 * @param {Array} efforts
 * @return {Array}
 */
function filterSegmentEfforts(efforts) {
  // Include only efforts for the canonical lap
  const filtered = efforts.filter(({ segment }) => lapSegmentId === segment.id);
  // Dedupe by start time
  const deduped = dedupeSegmentEfforts(filtered);
  // Format for our SegmentEffort model
  const formatted = deduped.map((effort) => formatSegmentEffort(effort));
  return formatted;
}

/**
 * Get laps data object from an activity
 *
 * @param {Object} activity
 * @param {Boolean} verbose Defaults to false
 * @return {Object} Activity JSON object, may have 0 laps
 */
function getActivityData(activity, verbose = false) {
  const {
    id,
    athlete,
    segment_efforts = [],
    start_date_local,
  } = activity;

  if (verbose) {
    console.log(`Activity ${id} has ${segment_efforts.length} segment efforts`);
  }

  // Should already have checked segment_efforts.length
  // but it can't hurt to check again
  const laps = segment_efforts.length
    ? calculateLapsFromSegmentEfforts(segment_efforts)
    : 0;

  if (verbose) {
    console.log(`Activity ${id} has ${laps} laps`);
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
  dedupeSegmentEfforts,
  filterSegmentEfforts,
  fetchActivity,
  activityCouldHaveLaps,
  getActivityData,
};
