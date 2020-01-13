const {
  lapSegmentId,
  sectionSegmentIds,
} = require('../../config');
const { dedupeSegmentEfforts } = require('./utils');

/**
 * Get number of canonical sections *not* found in an array of ridden segments
 *
 * @param {Array} riddenSections
 * @return {Number}
 */
function getUnriddenSections(riddenSections) {
  return [...sectionSegmentIds]
    .filter((id) => riddenSections.indexOf(id) === -1)
    .length;
}

/**
 * Logic to calculate number of laps from array of segment efforts
 *
 * @param {Array} segmentEfforts
 * @reutrn {Number}
 */
function calculateLapsFromSegmentEfforts(segmentEfforts) {
  // Get number of lap segments and an array of section segments
  let laps = 0;
  const canonicalLaps = [];
  const sectionsRidden = [];
  segmentEfforts.forEach((effort) => {
    const {
      id: segmentId,
    } = effort.segment;

    if (lapSegmentId === segmentId) {
      // Count canonical full lap segments
      canonicalLaps.push(effort);
    } else if (sectionSegmentIds.indexOf(segmentId) !== -1) {
      // Array of canonical lap section segments
      sectionsRidden.push(segmentId);
    }
  });

  laps = dedupeSegmentEfforts(canonicalLaps).length;

  // Remove complete laps from sections ridden
  // OK to stringify since arrays contain only numeric values
  const sectionsRiddenStr = sectionsRidden.join(',');
  const sectionsCanonicalRegex = new RegExp(sectionSegmentIds.join(','), 'g');
  const leftoverSections = sectionsRiddenStr
    .replace(sectionsCanonicalRegex, '')
    .replace(/,{2,}/g, ',')
    .split(',')
    .map((section) => {
      if (section.length && !Number.isNaN(section)) {
        return parseInt(section, 10);
      }
      return 0;
    });


  // Check that laps removed from sections === the number of lap segments
  const removedSections = sectionsRidden.length - leftoverSections.length;
  const removedLaps = removedSections / sectionSegmentIds.length;
  if (removedLaps !== laps) {
    return laps;
  }

  // Are leftover sections enough to add an extra lap?
  if (getUnriddenSections(leftoverSections) <= 1) {
    return laps + 1;
  }

  return laps;
}

module.exports = calculateLapsFromSegmentEfforts;
