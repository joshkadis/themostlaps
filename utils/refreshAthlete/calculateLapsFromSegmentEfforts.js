const {
  sectionSegmentIds,
} = require('../../config');

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
 * Assembles partial laps and combines with received number of
 * canonical (full-lap) segment efforts, assumes these have
 * ALREADY been deduped
 *
 * @param {Array} segmentEfforts All segment efforts
 * @param {Array} numFullLaps Number of deduped full-lap efforts
 * @reutrn {Number}
 */
function calculateLapsFromSegmentEfforts(segmentEfforts, numFullLaps = 0) {
  // Get number of lap segments and an array of section segments
  const laps = numFullLaps;
  const sectionsRidden = [];
  segmentEfforts.forEach((effort) => {
    const {
      id: segmentId,
    } = effort.segment;

    if (sectionSegmentIds.indexOf(segmentId) !== -1) {
      // Array of canonical lap section segments
      sectionsRidden.push(segmentId);
    }
  });

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
