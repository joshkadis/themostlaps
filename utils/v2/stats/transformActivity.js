
const _flatten = require('lodash/flatten');
const _uniq = require('lodash/uniq');
const { locations: allLocations } = require('../../../config');
const { findPotentialLocations } = require('../activityQueue/findPotentialLocations');
const activityStatsFromStream = require('../activityQueue/activityStatsFromStream');
const {
  calculateLapsFromSegmentEfforts,
  calculateLapsFromDefinitions,
} = require('./calculateLaps');

/**
 * Get array of unique segment IDs in lapDefinitions
 *
 * @param {String} locName
 * @return {Array}
 */
const getlapDefinitionsIds = (locName) => {
  const {
    lapDefinitions = [],
  } = allLocations[locName];
  return _uniq(_flatten(lapDefinitions));
};

/**
 * Get all segment Ids (canonical and section) for a location
 *
 * @param {String} loc
 * @returns {Array} Array of Ids, empty array if location not found
 */
function getAllSegmentIdsForLocation(loc) {
  if (!allLocations[loc]) {
    return [];
  }

  const {
    canonicalSegmentId,
    sectionSegmentIds = [],
    lapDefinitions = [],
  } = allLocations[loc];
  const lapDefinitionsIds = _flatten(lapDefinitions);

  return _uniq([
    canonicalSegmentId,
    ...sectionSegmentIds,
    ...lapDefinitionsIds,
  ]);
}

/**
 * Convert raw Strava API data to base of Activity data model
 *
 * @param {Object} activity
 * @param {Object} overrides Optional. Properties to override output
 * @returns {Object}
 */
function formatActivity(activity, overrides) {
  // @todo Refactor vs LocationIngest.formatActivity
  const {
    id: _id,
    athlete,
    start_date_local,
    start_date,
  } = activity;
  return {
    _id,
    added_date: new Date().toISOString(),
    athlete_id: athlete.id,
    source: 'webhook',
    start_date_local,
    startDateUtc: new Date(start_date),
    ...overrides,
  };
}

/**
 * Convert raw Strava API data to base of SegmentEffort data model
 *
 * @param {Object} activity
 * @param {Object} overrides Optional. Properties to override output
 * @returns {Object}
 */
function formatSegmentEffort(effort, overrides) {
  // @todo Refactor vs LocationIngest.formatSegmentEffort
  const {
    id: _id,
    elapsed_time,
    moving_time,
    start_date_local,
    start_date,
  } = effort;

  return {
    _id,
    elapsed_time,
    moving_time,
    start_date_local,
    startDateUtc: new Date(start_date),
    ...overrides,
  };
}

/**
 * Collapse relevant segment Ids for multiple locations into single array
 *
 * @param {Array} potentialLocs Optional list of locations to filter for.
 * @returns {Array} array of segment Ids
 */
function getAllSegmentIdsForAllLocations(potentialLocs = []) {
  const allRelevantIds = Object.keys(allLocations).reduce((acc, locName) => {
    // If any locations are specified, skip any that aren't in the list
    if (potentialLocs.length && potentialLocs.indexOf(locName) === -1) {
      return acc;
    }
    return [
      ...acc,
      ...getAllSegmentIdsForLocation(locName),
    ];
  }, []);
  return _uniq(allRelevantIds);
}

/**
 * Checks if segment effort duplicates any existing effort in array
 *
 * @param {Object} newEffort
 * @param {Array} prevEfforts
 * @returns {Boolean}
 */
function isDuplicateEffort(newEffort, prevEfforts) {
  for (let idx = 0; idx < prevEfforts.length; idx += 1) {
    const prevEffort = prevEfforts[idx];
    // Is duplicate if start time and segment id match
    if (newEffort.start_date === prevEffort.start_date
      && newEffort.segment.id === prevEffort.segment.id
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Filter and dedupe all segment efforts by canonicalSegmentId, sectionSegmentIds, lapDefinitions
 *
 * @param {Array} segmentEfforts
 * @param {Array} potentialLocations Optional. Specify location names to look for
 * @returns {Object} locations
 * @returns {Array} locations[locName].canonicalSegmentEfforts
 * @returns {Array} locations[locName].lapDefinitionsSegmentEfforts
 * @returns {Array} locations[locName].relevantSegmentEfforts
 */
function filterSegmentEfforts(segmentEfforts, potentialLocations = []) {
  const allRelevantSegmentIds = getAllSegmentIdsForAllLocations(
    potentialLocations,
  );
  const searchLocNames = potentialLocations.length
    ? potentialLocations
    : Object.keys(allLocations);

  // Set up object for each location to receive segment efforts
  const filteredEfforts = searchLocNames.reduce((acc, locName) => {
    acc[locName] = {
      relevantSegmentEfforts: [],
      canonicalSegmentEfforts: [],
      lapDefinitionsSegmentEfforts: [],
    };
    return acc;
  }, {});

  // Loop through all efforts
  segmentEfforts.forEach((effort) => {
    const { segment } = effort;
    const { id: segmentIdForEffort } = segment;

    // Skip all segments efforts that aren't relevant to any of our locations
    if (allRelevantSegmentIds.indexOf(segmentIdForEffort) === -1) {
      return;
    }

    // Now we know that this segment effort is relevant to one of our locations.
    // Let's figure out which one.
    searchLocNames.forEach((locName) => {
      const { canonicalSegmentId } = allLocations[locName];
      const {
        relevantSegmentEfforts,
        lapDefinitionsSegmentEfforts,
        canonicalSegmentEfforts,
      } = filteredEfforts[locName];

      if (getAllSegmentIdsForLocation(locName)
        .indexOf(segmentIdForEffort) === -1
        || isDuplicateEffort(effort, relevantSegmentEfforts)
      ) {
        // Skip if not relevant to this location or is a duplicate
        return;
      }

      // Add everything to relevant segments
      relevantSegmentEfforts.push(effort);

      const definitionIds = getlapDefinitionsIds(locName);
      // Add lap definition efforts if using lap definitions method
      if (definitionIds.length
        && definitionIds.indexOf(segmentIdForEffort) !== -1
      ) {
        lapDefinitionsSegmentEfforts.push(effort);
      }

      if (segmentIdForEffort === canonicalSegmentId) {
        canonicalSegmentEfforts.push(effort);
      }
    });
  });
  // Now each location has:
  // relevantSegmentEfforts: Deduped array of all segment efforts for canonical lap, lap sections (v1), and lap definitions (v2)
  // lapDefinitionsSegmentEfforts: Deduped array of all segment efforts for lap definition segments (v2)
  // canonicalSegmentEfforts: Deduped array of all segment efforts for the canonical lap
  return filteredEfforts;
}

/**
 * Get laps for locations contained in raw activity data
 *
 * @param {Object}
 * @returns {Object} locations
 * @returns {String} locations[locName].locName
 * @returns {Number} locations[locName].laps
 * @returns {Array} locations[locName].segmentEfforts
 */
function activityStatsFromSegmentEfforts(activity) {
  const {
    segment_efforts: segmentEfforts,
  } = activity;

  // First filter the segment efforts
  const potentialLocs = findPotentialLocations(activity);
  const filteredEfforts = filterSegmentEfforts(
    segmentEfforts,
    potentialLocs,
  );

  let winningLocation = {};
  const activityLocations = [];

  Object.keys(filteredEfforts)
    .forEach((locName) => {
      const {
        canonicalSegmentEfforts = [],
        relevantSegmentEfforts = [],
        lapDefinitionsSegmentEfforts = [],
      } = filteredEfforts[locName];

      const locConfig = allLocations[locName];
      let laps = canonicalSegmentEfforts.length;
      // Prefer calculate with newer lap definitions method
      if (
        locConfig.lapDefinitions
        && locConfig.lapDefinitions.length
        && lapDefinitionsSegmentEfforts.length
      ) {
        laps = calculateLapsFromDefinitions(
          lapDefinitionsSegmentEfforts,
          locConfig,
        );
      } else {
        // Fall back to original section segments method
        laps = calculateLapsFromSegmentEfforts(
          relevantSegmentEfforts,
          canonicalSegmentEfforts.length,
          locConfig.canonicalSegmentId,
        );
      }

      const segment_efforts = filteredEfforts[locName].canonicalSegmentEfforts
        .map(formatSegmentEffort);

      const result = {
        // If for some reason we have more canonical laps than calculated laps, go with that
        laps: laps < segment_efforts.length ? segment_efforts.length : laps,
        location: locName,
        segment_efforts,
      };

      // Location with the most laps "wins"
      if (!winningLocation.laps || laps > winningLocation.laps) {
        winningLocation = result;
      }

      activityLocations.push(result);
    });

  const outputToActivity = {
    ...winningLocation,
    activityLocations,
  };
  return outputToActivity;
}

/**
 * Transform raw Strava API response for activity
 * into Activity data model
 *
 * @param {Object} activity Strava API response for activity
 * @param {Boolean} isSubscriber If false, will calculate stats from latlng stream
 *                               instead of segment_efforts
 */
async function transformActivity(activity, isSubscriber = true) {
  const activityStats = isSubscriber
    ? activityStatsFromSegmentEfforts(activity)
    : await activityStatsFromStream(activity);
  const activityData = formatActivity(activity);
  return {
    ...activityData,
    ...activityStats,
  };
}

module.exports = {
  transformActivity,
  activityStatsFromSegmentEfforts,
  getAllSegmentIdsForLocation,
  getAllSegmentIdsForAllLocations,
  isDuplicateEffort,
  filterSegmentEfforts,
  formatActivity,
  formatSegmentEffort,
  getlapDefinitionsIds,
};
