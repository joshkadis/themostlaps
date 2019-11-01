const { handleLegacyAthleteStats } = require('./getAthletes');

test('handleLegacyAthleteStats', () => {
  const athlete = {
    name: 'Jan',
    stats: {
      stat1: 0,
    },
  };

  expect(handleLegacyAthleteStats(athlete).stats)
    .toEqual({
      locations: {
        prospectpark: {
          stat1: 0,
        },
      },
    });

  athlete.stats = {
    locations: {
      centralpark: {
        stat1: 1,
      },
    },
    stat1: 2,
  };

  expect(handleLegacyAthleteStats(athlete).stats)
    .toEqual({
      locations: {
        centralpark: {
          stat1: 1,
        },
        prospectpark: {
          stat1: 2,
        },
      },
    });

  athlete.stats = {
    locations: {
      prospectpark: {
        stat1: 3,
      },
      centralpark: {
        stat1: 4,
      },
    },
  };

  expect(handleLegacyAthleteStats(athlete).stats)
    .toEqual({
      locations: {
        centralpark: {
          stat1: 4,
        },
        prospectpark: {
          stat1: 3,
        },
      },
    });
});
