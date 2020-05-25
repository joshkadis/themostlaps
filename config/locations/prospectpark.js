module.exports = {
  locationCenter: {
    latitude: 40.661990,
    longitude: -73.969681,
  },
  allowedRadius: 50000,
  minDistance: 5000,
  maxLapRadius: 1400, // padded max distance from locationCenter to a point on loop
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
  waypoints: {
    // TML - Prospect Park
    // https://www.google.com/maps/d/u/0/edit?mid=1pzdBMC7KjlC9F6freuVieVEmm38b63DT
    points: [
      // Grand Army Plaza
      [[40.67107, -73.96903], [40.67097, -73.97049]],
      // 3rd Street
      [[40.66825, -73.97235], [40.66749, -73.97235]],
      // 15th Street
      [[40.66171, -73.97748], [40.66067, -73.97735]],
      // Prospect Park Southwest
      [[40.65858, -73.97334], [40.65751, -73.9731]],
      // Ocean Parkway Circle
      [[40.65313, -73.972], [40.65204, -73.97027]],
      // Ocean Ave
      [[40.65516, -73.96353], [40.6558, -73.96311]],
      // Lincoln Road
      [[40.65987, -73.96375], [40.66035, -73.96404]],
      // Zoo
      [[40.66128, -73.96458], [40.66228, -73.96506]],
    ],
    segments: [
      [0, 1, 343],
      [1, 2, 827],
      [2, 3, 422],
      [3, 4, 521],
      [4, 5, 683],
      [5, 6, 471],
      [6, 7, 112],
      [7, 0, 1118],
    ],
  },
};
