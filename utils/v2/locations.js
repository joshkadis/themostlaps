const { locations } = require('../../config');

function getLocationNames() {
  return Object.keys(locations);
}

function isValidLocation(location) {
  return getLocationNames().indexOf(location) >= 0;
}

function getCanonicalSegmentIds() {
  return Object.keys(locations)
    .map((location) => locations[location].canonicalSegmentId);
}

function isValidCanonicalSegmentId(segmentId) {
  return getCanonicalSegmentIds().indexOf(segmentId) >= 0;
}

function getLocationNameFromSegmentId(segmentId) {
  return Object.keys(locations)
    .find((name) => locations[name].canonicalSegmentId === segmentId);
}

const getSegmentIdFromLocName = (locName) => (locations[locName]
  ? locations[locName].canonicalSegmentId
  : false);

module.exports = {
  getLocationNames,
  isValidLocation,
  getCanonicalSegmentIds,
  isValidCanonicalSegmentId,
  getLocationNameFromSegmentId,
  getSegmentIdFromLocName,
};
