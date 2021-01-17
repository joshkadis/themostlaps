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
  // use lapDefinitions instead for new locations
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
  waypoints: [
    { lat: 40.65995, lon: -73.97536 },
    { lat: 40.65374, lon: -73.97197 },
    { lat: 40.65358, lon: -73.96722 },
    { lat: 40.65755, lon: -73.96296 },
    { lat: 40.66082, lon: -73.96434 },
    { lat: 40.66393, lon: -73.96548 },
    { lat: 40.67083, lon: -73.96872 },
    { lat: 40.67056, lon: -73.97081 },
    { lat: 40.66542, lon: -73.97297 },
  ],
  lapMarker: { lat: 40.66192, lon: -73.96489 },
  lapLength: 5448,
  useStream: true,
};
