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
      1666631, // MOMA -> after Engineers Gate
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
      1786662, // Carousel -> E 72nd
      12540076, // Top of Harlem Hill to W 68th (ends before Tavern/67th)
    ],
    [ // Columbus Circle
      1786662, // Carousel -> E 72nd
      12540076, // Top of Harlem Hill -> W 68th
    ],
    [ // 6th Ave -> 7th Ave
      1786662, // Carousel -> 72nd
      12540076, // Top of Harlem Hill -> W 68th
    ],
  ],
};
