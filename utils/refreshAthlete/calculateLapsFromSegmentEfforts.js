const {
  lapSegmentId,
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
    .filter((id) => -1 === riddenSections.indexOf(id))
    .length;
}

/**
 * Logic to calculate number of laps from array of segment efforts
 *
 * @param {Array} segmentEfforts
 * @reutrn {Number}
 */
module.exports = (segmentEfforts) => {
  // Get number of lap segments and an array of section segments
  let laps = 0;
  const sectionsRidden = [];
  segmentEfforts.forEach(({ segment }) => {
    if (lapSegmentId === segment.id) {
      laps++;
    } else if (-1 !== sectionSegmentIds.indexOf(segment.id)) {
      sectionsRidden.push(segment.id);
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
    .map((section) =>
      (section.length && !isNaN(section)) ? parseInt(section, 10) : 0);

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
};