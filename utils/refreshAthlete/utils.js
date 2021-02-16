const _has = require('lodash/has');
const {
  lapSegmentId,
} = require('../../config');
const fetchStravaAPI = require('../fetchStravaAPI');
const calculateLapsFromSegmentEfforts = require('./calculateLapsFromSegmentEfforts');
const Athlete = require('../../schema/Athlete');
const { findPotentialLocations } = require('../v2/activityQueue/findPotentialLocations');
const { captureSentry } = require('../v2/services/sentry');

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
    captureSentry('Error fetching activity', 'fetchActivity', {
      extra: {
        activityId,
        athleteId: athleteDoc.id,
        status: response.stats,
      },
    });
    return false;
  }

  return response;
}

/**
 * Check where an activity is eligible to maybe have laps.
 * Keep it eligible for future checking
 * e.g. can't disqualify unless a property is *set* to a value we don't want
 *
 * @param {Object} activity
 * @param {Bool} verbose
 * @param {Object} overrideLocations Will replace default locations when checking findPotentialLocations
 * @return {Boolean} True if activity has the right attrs and is near at least one location
 */
function activityCouldHaveLaps(
  activity,
  verbose = false,
  overrideLocations,
) {
  const activityHas = (key) => _has(activity, key);

  const {
    id,
    type,
    trainer,
    manual,
  } = activity;

  // First make sure it has an id
  if (!activityHas('id')) {
    return false;
  }

  let reason = '';
  if (activityHas('type') && type.toLowerCase() !== 'ride') {
    reason = `Activity ${id} is not a Ride.`;
  } else if (activityHas('manual') && manual) {
    reason = `Activity ${id} is a manual activity.`;
  } else if (activityHas('trainer') && trainer) {
    reason = `Activity ${id} is a trainer activity.`;
  }

  if (reason) {
    if (verbose) {
      console.log(reason);
    }
    return false;
  }

  if (
    activityHas('distance')
    && activityHas('start_latlng')
    && activityHas('end_latlng')
  ) {
    const potentials = findPotentialLocations(
      activity,
      {
        verbose,
        locations: overrideLocations,
      },
    );
    return potentials.length > 0;
  }

  return true;
}

/**
 * Dedupe segment efforts from JSON array
 * NOTE: Assumes all segment efforts refer to the same segment!
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
 * Format segment effort into our database model shape
 *
 * @param {Object} effort Segment effort from Strava API
 * @return {Object}
 */
function formatSegmentEffort({
  id,
  elapsed_time,
  moving_time,
  start_date_local,
}) {
  return {
    _id: id,
    elapsed_time,
    moving_time,
    start_date_local,
  };
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
  let canonicalSegmentEfforts = [];
  let laps = 0;
  if (segment_efforts.length) {
    canonicalSegmentEfforts = filterSegmentEfforts(segment_efforts);
    laps = calculateLapsFromSegmentEfforts(
      segment_efforts,
      canonicalSegmentEfforts.length,
    );
  }

  if (verbose) {
    console.log(`Activity ${id} has ${laps} laps`);
  }

  const added = new Date();
  return {
    _id: id,
    added_date: added.toISOString(),
    athlete_id: athlete.id,
    laps,
    segment_efforts: canonicalSegmentEfforts,
    source: 'refresh',
    start_date_local,
  };
}

/**
 * Increment a date string by ms and return ISO string without ms
 *
 * @param {String} startDateString ISO 8601 string
 * @param {Number} increment MS to increment by
 * @returns {String} ISO 8601 string with MS stripped
 */
const incrementDate = (startDateString, increment = 0) => {
  const startDate = new Date(startDateString);
  const endDate = new Date(startDate.valueOf() + increment);
  return endDate.toISOString().replace(/\.\d{3}Z/, 'Z');
};

module.exports = {
  incrementDate,
  dedupeSegmentEfforts,
  filterSegmentEfforts,
  fetchActivity,
  formatSegmentEffort,
  activityCouldHaveLaps,
  getActivityData,
};
