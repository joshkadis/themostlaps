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
   * 1. Start segments must be unique
   * 2. Segments cannot contain start/finish of canonical lap
   */
  lapBoundaries: [
    // E 72nd
    [849072, 7169109],
    // Engineers Gate
    [1397141, 3911767],
    // Harlem end of CP
    [12540076, 3911767],
    // anywhere between Harlem and W 72nd
    [1541329, 1397141],
    // W 72nd
    [9258510, 20604213],
    // W 67th
    [4056892, 12540076],
    // Columbus Circle
    [7848923, 12540076],
    // 6th Ave -> 7th Ave
    [1786662, 12540076],
    // 5th Ave and Central Park South
    [7169109, 11938482],
  ],
};
