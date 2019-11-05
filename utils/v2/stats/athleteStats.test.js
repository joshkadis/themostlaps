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

test('transformAthleteStats', () => {
  expect(transformAthleteStats()).toEqual({
    allTime: 0,
    single: 0,
    byYear: [],
    byMonth: [],
    availableYears: [],
  });

  expect(transformAthleteStats({
    allTime: 2,
    single: 2,
  })).toEqual({
    allTime: 2,
    single: 2,
    byYear: [],
    byMonth: [],
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
      [2016, 93],
      [2017, 33],
      [2018, 63],
    ],
    byMonth: [
      [2016, 1, 30],
      [2016, 2, 31],
      [2016, 3, 32],
      [2017, 1, 10],
      [2017, 2, 11],
      [2017, 3, 12],
      [2018, 1, 20],
      [2018, 2, 21],
      [2018, 3, 22],
    ],
  });
});
