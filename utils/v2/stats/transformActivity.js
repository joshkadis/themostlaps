const { locations: allLocations } = require('../../../config');
const {
  getCanonicalSegmentIds,
  getSegmentIdFromLocName,
} = require('../locations');
const { findPotentialLocations } = require('../activityQueue/findPotentialLocations');

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
    const prevEffort = prevEffort[idx]
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
 * @returns {Object} locations
 * @returns {Array} locations[locName].segmentEfforts
 * @returns {Array} locations[locName].laps
 */
function filterSegmentEfforts(segmentEfforts, potentialLocations = []) {
  const relevantSegments = collapseRelevantSegmentIds(potentialLocations);
  const searchLocNames = potentialLocations.length
    ? potentialLocs
    : Object.keys(allLocations);

  // Loop through all segmentEfforts
    // { locName: canonicalSegmentEfforts: [], sectionSegmentEfforts: [] }
  const filteredEfforts = searchLocNames.reduce((acc, locName) => {
    acc[locName] = {
      canonicalSegmentEfforts: [],
      sectionSegmentEfforts: [],
    };
    return acc;
  }, {});

  // Loop through all efforts
  segmentEfforts.forEach((effort) => {
    const { segment } = effort;
    const { id: segmentId } = segment;

    // Will ignore almost all segments efforts,
    // very few will be associated with anything in allLocations
    if (relevantSegments.indexOf(segmentId) === -1) {
      return;
    }

    // Now we know this is a canonical or section segment effort
    // So find its location and add it there
    searchLocNames.forEach((locName) => {
      const {
        canonicalSegmentId,
        sectionSegmentIds,
      } = allLocations[locName];

      const {
        canonicalSegmentEfforts,
        sectionSegmentEfforts,
      } = filteredEfforts[locName];

      // Add canonical segment effort if not duplicate
      if (segmentId === canonicalSegmentId
          && !isDuplicateEffort(effort, canonicalSegmentEfforts)
      ) {
        filteredEfforts[locName].canonicalSegmentEfforts.push(effort);
      }

      // Add section segment effort if not duplicate
      if (sectionSegmentIds.indexOf(segmentId) !== -1
        && !isDuplicateEffort(effort, sectionSegmentEfforts)
      ) {
        filteredEfforts[locName].sectionSegmentEfforts.push(effort);
      }
    });
  });
  // Now we've gone through all the segment efforts and done one of three things
  // 1. Ignored it
  // 2. Added it as a *canonical* segment effort for its location in filteredEfforts
  // 3. Added it as a *segment* segment effort for its location in filteredEfforts
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
function getLapsFromRawActivity(activity) {
  const {
    segment_efforts: segmentEfforts,
  } = activity;

  const potentialLocs = findPotentialLocations(activity);
  const locationsObj = getDataFromSegmentEfforts(
    segmentEfforts,
    potentialLocs
  );

  // First filter the segment efforts
  const result = filterSegmentEfforts(segmentEfforts);

  // Then calculate laps by including assembly from partial laps
  calculateLapsFromSegmentEfforts(result, segmentEfforts);

  return result;
}
