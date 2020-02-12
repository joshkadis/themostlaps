/**
 * Counts laps from segment IDs that have been filtered to include
 * boundary start-mid-end segments
 *
 * @param {Array} filteredSegmentIds Array of segment IDs
 * @param {Array} boundarySegments Segment IDs
 * @param {Number} boundarySegments[0] ID of start segment
 * @param {Number} boundarySegments[1] ID of middle segment
 * @param {Number} boundarySegments[2] ID of end segment
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

module.exports = {
  countFilteredLaps,
};
