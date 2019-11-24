const { locations } = require('../../config');

function getLocationNames() {
  return Object.keys(locations);
}

function isValidLocation(location) {
  return getLocationNames().indexOf(location) >= 0;
}

function getCanonicalSegmentIds() {
  return Object.keys(locations).reduce((acc, locationName) => {
    acc.push(locations[locationName].canonicalSegmentId);
    return acc;
  }, []);
}

function isValidCanonicalSegmentId(segmentId) {
  return getCanonicalSegmentIds().indexOf(segmentId) >= 0;
}

module.exports = {
  getLocationNames,
  isValidLocation,
  getCanonicalSegmentIds,
  isValidCanonicalSegmentId,
};
