module.exports = {
  canonicalSegmentId: 1532085, // Start/Finish at E 85th
  locationName: 'centralpark',
  locationLabel: 'Central Park',
  locationCity: 'New York, NY',
  minDistance: 9500,
  allowedRadius: 50000,
  locationCenter: {
    latitude: 40.782864,
    longitude: -73.965355,
  },
  sectionSegmentIds: [],
  /*
   * Lap Definitions
   * - Start segments correspond to ciurcuit entry points
   * - Start segments MUST be unique
   * - Include as many additional segments as need to define a complete lap
   * - Additional segments should not overlap the entry point
   * - Guard against cut-throughs for partial laps 🤓
   */
  lapDefinitions: [
    // E 72nd
    [849072, 12540076, 7169109],
    // Engineers Gate
    [11938517, 1541329],
    // Harlem end of CP
    [12540076, 643782],
    // anywhere between Harlem and W 72nd
    [1541329, 643782, 1397141],
    // W 72nd
    [9258510, 20604213],
    // W 67th
    [4056892, 12540076],
    // Columbus Circle
    [7848923, 12540076],
    // 6th Ave -> 7th Ave
    [1786662, 12540076],
    // 5th Ave and Central Park South
    [3911767, 1397141, 11938482],
  ],
};
