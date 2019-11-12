const { transformAthleteStats } = require('./athleteStats');

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
  _2016_03: 32,
  _2018: 63,
  _2018_01: 20,
  _2018_02: 21,
  _2018_03: 22,
};

function mockYearByMonth(jan, feb, mar) {
  return [
    { month: 'Jan', value: jan },
    { month: 'Feb', value: feb },
    { month: 'Mar', value: mar },
    { month: 'Apr', value: 0 },
    { month: 'May', value: 0 },
    { month: 'Jun', value: 0 },
    { month: 'Jul', value: 0 },
    { month: 'Aug', value: 0 },
    { month: 'Sep', value: 0 },
    { month: 'Oct', value: 0 },
    { month: 'Nov', value: 0 },
    { month: 'Dec', value: 0 },
  ];
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
      2016: mockYearByMonth(30, 31, 32),
      2017: mockYearByMonth(10, 11, 12),
      2018: mockYearByMonth(20, 21, 22),
    },
  });
});
