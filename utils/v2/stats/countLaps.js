/**
 * Counts laps from segment IDs that have been filtered to include
 * boundary pair and canonical lap
 *
 * @param {Array} filteredSegmentIds Array of segment IDs
 * @param {Array} boundaryPairs [startId, endId] segment IDs
 * @param {Number} canonicalId Segment ID of canonical lap
 * @returns {Number} Number of laps completed
 */
function countFilteredLaps(filteredSegmentIds, [startId, endId], canonicalId) {
  // Now filter out what we know are complete laps
  // startSegment-canonicalSegment-endSegment
  const numCanonicalLaps = filteredSegmentIds.reduce(
    (num, segId) => (segId === canonicalId ? num + 1 : num),
    0,
  );
  const remainingSegments = filteredSegmentIds.filter((segId, idx, arr) => {
    switch (segId) {
      // Remove startSegment if followed by canonicalSegment then endSegment
      case startId:
        return !(arr[idx + 1] === canonicalId && arr[idx + 2] === endId);

      // Remove canonicalSegment if preceeded by startSegment, followed endSegment
      case canonicalId:
        return !(arr[idx - 1] === startId && arr[idx + 1] === endId);

      // Remove endSegment if preceeded by startSegment and canonicalSegment
      case endId:
        return !(arr[idx - 1] === canonicalId && arr[idx - 2] === startId);

      default:
        return true;
    }
  });
  console.log(filteredSegmentIds, remainingSegments);
  if (remainingSegments.length >= 2
    && remainingSegments[0] === startId
    && remainingSegments[1] === endId
  ) {
    return numCanonicalLaps + 1;
  }
  return numCanonicalLaps;
}

module.exports = {
  countFilteredLaps,
};
