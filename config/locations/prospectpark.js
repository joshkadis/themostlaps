module.exports = {
  locationCenter: {
    latitude: 40.661990,
    longitude: -73.969681,
  },
  allowedRadius: 50000,
  minDistance: 5000,
  addMakeupLap: true, // Avoids excess API calls when ingesting new user
  devFetchActivities: 10,
  lapSegmentId: 5313629, // Prospect Park Race Lap
  // sectionSegmentIds is deprecated
  // use lapBoundaries instead for new locations
  sectionSegmentIds: [
    613198, // Prospect Park hill
    4435603, // Top of Prospect Park
    4362776, // Prospect Pure Downhill
    9699985, // Sprint between the lights
    740668, // E Lake Drive
  ],
  // v2 updated properties
  canonicalSegmentId: 5313629,
  locationName: 'prospectpark',
  locationLabel: 'Prospect Park',
  locationCity: 'Brooklyn, NY',
};
