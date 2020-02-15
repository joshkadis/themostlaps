const _find = require('lodash/find');
const { locations: allLocations } = require('../../../config');
const { getLocationNameFromSegmentId } = require('../locations');

/**
 * Get all possible sequence of section segments by ID
 * To use with original lap calculation method
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
 * Counts laps from segment IDs that have been filtered to include
 * definition start-mid-end segments
 *
 * @param {Array} filteredSegmentIds Array of segment IDs
 * @param {Array} definitionSegments Segment IDs
 * @param {Number} definitionSegments[0] ID of start segment
 * @param {Number} definitionSegments[1] ID of middle segment
 * @param {Number} definitionSegments[2] ID of end segment
 * @returns {Number} Number of laps completed
 */
function countFilteredLaps(
  filteredSegmentIds,
  [startId, midId, endId],
) {
  const lapRegex = new RegExp([startId, midId, endId].join(','), 'g');
  const matches = filteredSegmentIds.join(',').match(lapRegex) || [];
  return matches.length;
}

/**
 * Calculate laps using new lapDefinitions technique
 * REQUIRES a unique start segment for each definition set
 *
 * @param {Array} efforts Segment Efforts for lapDefinitions and canonical segments
 * @param {Object} locConfig Config object for location
 * @returns {Number}
 */
function calculateLapsFromDefinitions(efforts, locConfig) {
  // Segment IDs corresponding to segment efforts
  const effortsSegmentIds = efforts.map((eff) => eff.segment.id);
  const {
    lapDefinitions = [],
    canonicalSegmentId: canonicalId,
  } = locConfig;

  if (!lapDefinitions.length) {
    return 0;
  }

  // Array of segment IDs which are the start of a definition set
  const definitionStartIds = [];
  // Map of start segments to definition sets
  const definitionPairsMap = {};
  lapDefinitions.forEach((bounds) => {
    definitionStartIds.push(bounds[0]);
    definitionPairsMap[bounds[0]] = bounds;
  });

  // Find the start segment that appears first
  // Assumes start segments are unique!!
  const firstOccurringId = _find(
    effortsSegmentIds,
    (id) => definitionStartIds.indexOf(id) !== -1,
  );

  // Filter for identified definition set or canonical segments
  const definitionPair = definitionPairsMap[firstOccurringId];
  const filteredSegmentIds = effortsSegmentIds.filter(
    (id) => [...definitionPair, canonicalId].indexOf(id) !== -1,
  );
  return countFilteredLaps(filteredSegmentIds, definitionPair, canonicalId);
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

module.exports = {
  calculateLapsFromDefinitions,
  calculateLapsFromSegmentEfforts,
  countFilteredLaps,
  getSegmentSequences,
};
