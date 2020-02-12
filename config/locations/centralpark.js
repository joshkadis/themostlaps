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
    [ // E 72nd
      849072, // Cat's Paw
      7169109, // Horse Shit Alley segment
    ],
    [ // Engineers Gate
      1397141, // Harlem Hill
      3911767, // Before E 72nd to MOMA
    ],
    [ // Harlem end of CP
      12540076, // Top of Harlem Hill -> W 68th
      3911767, // Before E 72nd to MOMA
    ],
    [ // anywhere between Harlem and W 72nd
      1541329, // W 78th -> E 79th (Bottom Half)
      1397141, // Harlem Hill
    ],
    [ // W 72nd
      9258510, // Tavern On the Green -> Cat's Paw
      20604213, // Base of Harlem Hill -> W 75th
    ],
    [ // W 67th
      4056892, // View 6th Ave Entrance to 72nd St Exit
      12540076, // Top of Harlem Hill to W 68th (ends before Tavern/67th)
    ],
    [ // Columbus Circle
      7848923, // Alt. Horse Shit Alley
      12540076, // Top of Harlem Hill -> W 68th
    ],
    [ // 6th Ave -> 7th Ave
      1786662, // Carousel -> 72nd
      12540076, // Top of Harlem Hill -> W 68th
    ],
    [ // 5th Ave and Central Park South
      7169109, // Horse Shit Alley
      11938482, // D6_CP.4:7,
    ],
  ],
};
