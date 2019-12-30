const Athlete = require('../../../schema/Athlete');
const {
  transformAthleteStats,
  updateAthleteStatsFromActivity,
} = require('./athleteStats');

const SAMPLE_RAW_STATS = {
  allTime: 189,
  single: 13,
  _2017: 33,
  _2017_01: 10,
  _2017_02: 11,
  _2017_03: 12,
  _2016: 93,
  _2016_01: 30,
  _2016_02: 31,
  _2016_12: 32,
  _2018: 63,
  _2018_01: 20,
  _2018_02: 21,
  _2018_08: 22,
};

/**
 * Provide monthly totals to an empty byMonth array
 *
 * @param {Array} List of [month, value] arrays
 * @return {Array}
 */
function mockYearByMonth(...args) {
  return args.reduce((acc, [idx, value]) => {
    acc[idx].value = value;
    return acc;
  }, [
    { month: 'Jan', value: 0 },
    { month: 'Feb', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Apr', value: 0 },
    { month: 'May', value: 0 },
    { month: 'Jun', value: 0 },
    { month: 'Jul', value: 0 },
    { month: 'Aug', value: 0 },
    { month: 'Sep', value: 0 },
    { month: 'Oct', value: 0 },
    { month: 'Nov', value: 0 },
    { month: 'Dec', value: 0 },
  ]);
}

test('transformAthleteStats', () => {
  expect(transformAthleteStats()).toEqual({
    allTime: 0,
    single: 0,
    byYear: [],
    byMonth: {},
    availableYears: [],
  });

  expect(transformAthleteStats({
    allTime: 2,
    single: 2,
  })).toEqual({
    allTime: 2,
    single: 2,
    byYear: [],
    byMonth: {},
    availableYears: [],
  });

  expect(transformAthleteStats(SAMPLE_RAW_STATS)).toEqual({
    allTime: 189,
    single: 13,
    availableYears: [
      2016,
      2017,
      2018,
    ],
    byYear: [
      { year: 2016, value: 93 },
      { year: 2017, value: 33 },
      { year: 2018, value: 63 },
    ],
    byMonth: {
      2016: mockYearByMonth([0, 30], [1, 31], [11, 32]),
      2017: mockYearByMonth([0, 10], [1, 11], [2, 12]),
      2018: mockYearByMonth([0, 20], [1, 21], [7, 22]),
    },
  });

  // Discard months > 12
  // No big deal if yearly total no longer adds up
  // since extra months would break the chart
  expect(transformAthleteStats({
    allTime: 10,
    single: 5,
    _2018: 10,
    _2018_01: 5,
    _2018_02: 3,
    _2018_18: 2,
  }))
    .toEqual({
      allTime: 10,
      single: 5,
      availableYears: [2018],
      byYear: [{ year: 2018, value: 10 }],
      byMonth: {
        2018: mockYearByMonth([0, 5], [1, 3]),
      },
    });
});

test('updateAthleteStatsFromActivity()', () => {
  const defaultStats = {
    allTime: 10,
    _2018: 10,
    _2018_01: 10,
  };

  const athlete = new Athlete({
    stats: { ...defaultStats },
  });

  updateAthleteStatsFromActivity(athlete, 5, '2018-01-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 15,
    _2018: 15,
    _2018_01: 15,
  });
  athlete.set({ stats: { ...defaultStats } });

  updateAthleteStatsFromActivity(athlete, 5, '2018-03-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 15,
    _2018: 15,
    _2018_01: 10,
  });
  athlete.set({ stats: { ...defaultStats } });

  updateAthleteStatsFromActivity(athlete, -5, '2018-01-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 5,
    _2018: 5,
    _2018_01: 5,
  });

  updateAthleteStatsFromActivity(athlete, 2, '2018-01-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 7,
    _2018: 7,
    _2018_01: 7,
  });

  athlete.set({ stats: { ...defaultStats } });
  updateAthleteStatsFromActivity(athlete, -5, '2018-03-08T12:59:14Z');
  expect(athlete.stats).toStrictEqual({
    allTime: 5,
    _2018: 5,
    _2018_01: 10, // edge case where _2018_03 isn't already set
  });
});
