const {
  lapSegmentId,
  sectionSegmentIds,
} = require('../config');

/**
 * Confirm that all sections were found before the end of the first lap
 *
 * @param {Array} sectionsBeforeEndFirstLap
 * @return {Bool}
 */
function allSectionsBeforeEndFirstLap(sectionsBeforeEndFirstLap) {
  // Need at least enough sections to make a lap
  if (sectionsBeforeEndFirstLap.length < sectionSegmentIds.length) {
    return false;
  }

  // Last `sectionSegmentIds.length` segments before end of first lap
  // should constitute a whole lap
  const firstLapSections =
    sectionsBeforeEndFirstLap.slice((-1 * sectionSegmentIds.length));
  return getUnriddenSections(firstLapSections) === 0;
}

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
 * Reduce array of all segment efforts objects to an array of
 * only the segment ids we're interested in
 *
 * @param {Array} segmentEfforts
 * @return {Array}
 */
function getRelevantSegments(segmentEfforts) {
  return segmentEfforts.reduce((acc, { segment }) => {
    if (-1 !== sectionSegmentIds.indexOf(segment.id) ||
      lapSegmentId === segment.id
    ) {
      acc.push(segment.id);
    }
    return acc;
  }, []);
}

/**
 * Logic to calculate number of laps from array of segment efforts
 *
 * @param {Array} segmentEfforts
 * @reutrn {Number}
 */
module.exports = (segmentEfforts) => {
  const relevantSegments = getRelevantSegments(segmentEfforts);

  // Count all the complete lap segments
  let laps = relevantSegments.filter((id) => id === lapSegmentId).length;

  if (laps === 0) {
    return 0;
  }

  // Determine if extra sections before/after completed laps
  // constitute another lap that we need to add
  const sectionsBeforeEndFirstLap =
    relevantSegments.slice(0, relevantSegments.indexOf(lapSegmentId));
  const sectionsAfterEndLastLap =
    relevantSegments.slice(relevantSegments.lastIndexOf(lapSegmentId));

  if (!allSectionsBeforeEndFirstLap(sectionsBeforeEndFirstLap)) {
    return laps;
  }

  const remainingSections = sectionsBeforeEndFirstLap
    .slice(0, (-1 * sectionSegmentIds.length))
    .concat(sectionsAfterEndLastLap);
  // If 0 or 1 sections are left, count that as another lap ridden
  if (getUnriddenSections(remainingSections) <= 1) {
    return laps + 1;
  }
  return laps;
};
