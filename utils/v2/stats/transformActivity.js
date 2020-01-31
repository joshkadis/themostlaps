const { locations: allLocations } = require('../../../config');
const { findPotentialLocations } = require('../activityQueue/findPotentialLocations');
const { getLocationNameFromSegmentId } = require('../locations');

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
 * Collapse relevant segment Ids into single array
 *
 * @param {Array} potentialLocs Optional list of locations to filter for.
 * @returns {Array} array of segment Ids
 */
function collapseRelevantSegmentIds(potentialLocs = []) {
  return Object.keys(allLocations).reduce((acc, key) => {
    // If any locations are specified, skip any that aren't in the list
    if (potentialLocs.length && potentialLocs.indexOf(key) === -1) {
      return acc;
    }
    const {
      canonicalSegmentId,
      sectionSegmentIds,
    } = allLocations[key];
    return [...acc, canonicalSegmentId, ...sectionSegmentIds];
  }, []);
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
 * Filter and dedupe all segment efforts by canonical id
 *
 * @param {Array} segmentEfforts
 * @param {Array} potentialLocations Optional. Specify location names to look for
 * @returns {Object} locations
 * @returns {Array} locations[locName].canonicalSegmentEfforts
 * @returns {Array} locations[locName].relevantSegmentEfforts
 */
function filterSegmentEfforts(segmentEfforts, potentialLocations = []) {
  const allRelevantSegmentIds = collapseRelevantSegmentIds(potentialLocations);
  const searchLocNames = potentialLocations.length
    ? potentialLocations
    : Object.keys(allLocations);

  // Loop through all segmentEfforts to set up object with all locations like:
  // { locName: relevantSegmentEfforts: [], canonicalSegmentEfforts: [] }
  const filteredEfforts = searchLocNames.reduce((acc, locName) => {
    acc[locName] = {
      relevantSegmentEfforts: [],
      canonicalSegmentEfforts: [],
    };
    return acc;
  }, {});

  // Loop through all efforts
  segmentEfforts.forEach((effort) => {
    const { segment } = effort;
    const { id: segmentIdForEffort } = segment;

    // Will ignore almost all segments efforts,
    // very few will be actually associated with anything we care about
    if (allRelevantSegmentIds.indexOf(segmentIdForEffort) === -1) {
      return;
    }

    // Now we know this has to be a canonical or section segment effort
    // for one of the locations. Now we figure out which one.
    searchLocNames.forEach((locName) => {
      const { canonicalSegmentId } = allLocations[locName];
      const {
        relevantSegmentEfforts,
      } = filteredEfforts[locName];

      if (!isDuplicateEffort(effort, relevantSegmentEfforts)) {
        // Add to array of all relevant segment efforts
        filteredEfforts[locName].relevantSegmentEfforts = [
          ...filteredEfforts[locName].relevantSegmentEfforts,
          effort,
        ];
        // Maybe add to array of efforts for the canonical segment
        if (segmentIdForEffort === canonicalSegmentId) {
          filteredEfforts[locName].canonicalSegmentEfforts = [
            ...filteredEfforts[locName].canonicalSegmentEfforts,
            effort,
          ];
        }
      }
    });
  });
  // Now each location has:
  // relevantSegmentEfforts: An deduped array of all segment efforts for canonical lap and lap sections
  // canonicalSegmentEfforts: A deduped array of all segment efforts for the canonical lap
  return filteredEfforts;
}

/**
 * Calculate number of laps by assembling partial lap before/after full laps
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
  const allLocations = [];

  Object.keys(filteredEfforts)
    .forEach((locName) => {
      const numCanonicalLaps = filteredEfforts[locName]
        .canonicalSegmentEfforts
        .length;
      const laps = calculateLapsFromSegmentEfforts(
        filteredEfforts[locName].relevantSegmentEfforts,
        numCanonicalLaps,
        allLocations[locName].canonicalSegmentId,
      );

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

      allLocations.push(result);
    });

  const outputToActivity = {
    ...winningLocation,
    allLocations,
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
  getStatsFromRawActivity,
  collapseRelevantSegmentIds,
  isDuplicateEffort,
  filterSegmentEfforts,
  getSegmentSequences,
  calculateLapsFromSegmentEfforts,
  formatActivity,
  formatSegmentEffort,
};
