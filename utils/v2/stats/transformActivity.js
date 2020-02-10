const _find = require('lodash/find');
const _includes = require('lodash/includes');
const _flatten = require('lodash/flatten');
const _uniq = require('lodash/uniq');
const { locations: allLocations } = require('../../../config');
const { findPotentialLocations } = require('../activityQueue/findPotentialLocations');
const { getLocationNameFromSegmentId } = require('../locations');

/**
 * Get array of unique segment IDs in lapBoundaries
 *
 * @param {String} locName
 * @return {Array}
 */
const getLapBoundariesIds = (locName) => {
  const {
    lapBoundaries = [],
  } = allLocations[locName];
  return _uniq(_flatten(lapBoundaries));
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
    lapBoundaries = [],
  } = allLocations[loc];
  const lapBoundariesIds = _flatten(lapBoundaries);

  return _uniq([
    canonicalSegmentId,
    ...sectionSegmentIds,
    ...lapBoundariesIds,
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
 * Get all possible sequence of section segments by Id
 *
 * @param {Number} canonicalId
 * @returns {Array} sequences
 * @returns {Array} sequences[idx] Array of section segment ids
 */
function getSegmentSequences(canonicalId) {
  const locName = getLocationNameFromSegmentId(canonicalId);
  const sectionIds = [...allLocations[locName].sectionSegmentIds];
  const numSections = sectionIds.length;
  const sequences = [];
  sectionIds.forEach((sectionId, idx) => {
    const sequence = [
      ...sectionIds.slice(idx),
      ...sectionIds.slice((numSections * -1), idx),
    ];
    sequence.pop();
    sequences.push(sequence);
  });
  return sequences;
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
 * Filter and dedupe all segment efforts by canonicalSegmentId, sectionSegmentIds, lapBoundaries
 *
 * @param {Array} segmentEfforts
 * @param {Array} potentialLocations Optional. Specify location names to look for
 * @returns {Object} locations
 * @returns {Array} locations[locName].canonicalSegmentEfforts
 * @returns {Array} locations[locName].lapBoundariesSegmentEfforts
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
      lapBoundariesSegmentEfforts: [],
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
        lapBoundariesSegmentEfforts,
        canonicalSegmentEfforts,
      } = filteredEfforts[locName];

      if (getAllSegmentIdsForLocation(locName)
        .indexOf(segmentIdForEffort) === -1
        || isDuplicateEffort(effort, relevantSegmentEfforts)
      ) {
        // Skip if not relevant to this location or is a duplicate
        return;
      }

      relevantSegmentEfforts.push(effort);

      if (getLapBoundariesIds(locName).indexOf(segmentIdForEffort) !== -1) {
        lapBoundariesSegmentEfforts.push(effort);
      }

      if (segmentIdForEffort === canonicalSegmentId) {
        canonicalSegmentEfforts.push(effort);
      }
    });
  });
  // Now each location has:
  // relevantSegmentEfforts: Deduped array of all segment efforts for canonical lap, lap sections (v1), and lap boundaries (v2)
  // lapBoundariesSegmentEfforts: Deduped array of all segment efforts for lap boundary segments (v2)
  // canonicalSegmentEfforts: Deduped array of all segment efforts for the canonical lap
  return filteredEfforts;
}

/**
 * Calculate number of laps by assembling partial lap before/after full laps
 * uses original sectionSegmentIds method
 *
 * @param {Array} allEfforts Array of all relevant segment efforts for this location
 * @param {Number} numCanonicalLaps Number of numCanonicalLaps we already know about
 * @param {Number} segmentId ID of canonical segment we're building around
 * @returns {Number} Number of laps from this activity for a single location
 */
function calculateLapsFromSegmentEfforts(
  allEfforts,
  numCanonicalLaps,
  segmentId,
) {
  let numFoundLaps = 0;
  // Array of section efforts before the first and after the last canonical lap
  const partialLapEfforts = [];
  allEfforts.forEach((effort) => {
    if (effort.segment.id === segmentId) {
      numFoundLaps += 1;
      return;
    }
    if (numFoundLaps === 0 || numFoundLaps === numCanonicalLaps) {
      partialLapEfforts.push(effort);
    }
  });

  const sectionSegmentIdsStr = partialLapEfforts
    .reduce((acc, { segment }) => acc + segment.id, '');

  // Get sequences strings like ['123', '234', '341', '412']
  // from set of segment ids like [1,2,3,4]
  // leave off last segment to simulate enter/exit skipping a segment
  const possibleSectionSequences = getSegmentSequences(segmentId)
    .map((sequence) => sequence.join(''));

  // If any of the sequence strings are found the string representing
  // all the partial lap segments before first and after last full lap
  // Count it as a lap
  for (let idx = 0; idx < possibleSectionSequences.length; idx += 1) {
    if (sectionSegmentIdsStr.indexOf(possibleSectionSequences[idx]) > -1) {
      return numCanonicalLaps + 1;
    }
  }
  return numCanonicalLaps;
}

/**
 * Calculate laps using new lapBoundaries technique
 * REQUIRES a unique start segment for each boundary pair
 * DOES NOT use canonicalSegmentId!
 *
 * @param {Array} efforts Segment Efforts for lapBoundaries and canonical segments
 * @param {Object} locConfig Config object for location
 * @returns {Number}
 */
function calculateLapsFromBoundaries(efforts, locConfig) {
  // Segment IDs corresponding to segment efforts
  const effortsSegmentIds = efforts.map((eff) => eff.segment.id);
  const {
    lapBoundaries,
  } = locConfig;

  // Array of segment IDs which are the start of a boundary pair
  // Map of start segments to pairs
  const potentialStartIds = [];
  const potenialPairsByStartId = {};
  lapBoundaries.forEach((bounds) => {
    potentialStartIds.push(bounds[0]);
    potenialPairsByStartId[bounds[0]] = bounds;
  });

  // Find the start segment that appears first
  // Assumes start segments are unique!!
  const firstOccurringId = _find(
    effortsSegmentIds,
    (id) => _includes(potentialStartIds, id),
  );
  // Filter for identified boundary pair
  const boundaryPair = potenialPairsByStartId[firstOccurringId];
  const filteredSegmentIds = effortsSegmentIds.filter(
    (id) => _includes(boundaryPair, id),
  );

  // Now look for start-end sequences
  const lapRegex = new RegExp(`${boundaryPair[0]},${boundaryPair[1]}`, 'g');
  const segmentIdsStr = filteredSegmentIds.join(',');
  return (segmentIdsStr.match(lapRegex) || []).length;
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
function getStatsFromRawActivity(activity) {
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
        lapBoundariesSegmentEfforts = [],
      } = filteredEfforts[locName];

      const locConfig = allLocations[locName];
      let laps = canonicalSegmentEfforts.length;
      // Prefer calculate with newer lap boundaries method
      if (
        locConfig.lapBoundaries
        && locConfig.lapBoundaries.length
        && lapBoundariesSegmentEfforts.length
      ) {
        laps = calculateLapsFromBoundaries(
          lapBoundariesSegmentEfforts,
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
        laps,
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
 */
function transformActivity(activity) {
  const activityStats = getStatsFromRawActivity(activity);
  const activityData = formatActivity(activity);
  return {
    ...activityData,
    ...activityStats,
  };
}

module.exports = {
  transformActivity,
  calculateLapsFromBoundaries,
  getStatsFromRawActivity,
  getAllSegmentIdsForAllLocations,
  isDuplicateEffort,
  filterSegmentEfforts,
  getSegmentSequences,
  calculateLapsFromSegmentEfforts,
  formatActivity,
  formatSegmentEffort,
};
