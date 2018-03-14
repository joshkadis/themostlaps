const {
  statsForAthletePage,
  statsForSingleAthleteYearsChart,
} = require('./athleteStatsClient');

test('statsForAthletePage', () => {
  expect(statsForAthletePage({
    allTime: 10,
    single: 3,
  }))
    .toEqual({
      allTime: 10,
      single: 3,
      years: [],
      data: {},
    });

  expect(statsForAthletePage({
    allTime: 100,
    single: 13,
    _2017: 30,
  }))
    .toEqual({
      allTime: 100,
      single: 13,
      years: ['2017'],
      data: {
        2017: {
          total: 30,
        },
      },
    });

  expect(statsForAthletePage({
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
  }))
    .toEqual({
      allTime: 189,
      single: 13,
      years: ['2016', '2017', '2018'],
      data: {
        '2017': {
          total: 33,
          '01': 10,
          '02': 11,
          '03': 12,
        },
        '2018': {
          total: 63,
          '01': 20,
          '02': 21,
          '03': 22,
        },
        '2016': {
          total: 93,
          '01': 30,
          '02': 31,
          '03': 32,
        },
      },
    });
});

test('statsForSingleAthleteYearsChart', () => {
  expect(statsForSingleAthleteYearsChart({
    allTime: 189,
    single: 13,
    years: ['2016', '2017', '2018'],
    data: {
      '2017': {
        total: 33,
        '01': 10,
        '02': 11,
        '03': 12,
      },
      '2018': {
        total: 63,
        '01': 20,
        '02': 21,
        '03': 22,
      },
      '2016': {
        total: 93,
        '01': 30,
        '02': 31,
        '03': 32,
      },
    },
  }))
    .toEqual([
      { year: 2016, value: 93 },
      { year: 2017, value: 33 },
      { year: 2018, value: 63 },
    ]);

  expect(statsForSingleAthleteYearsChart({
    allTime: 189,
    single: 13,
    years: ['2016', '2018'],
    data: {
      '2018': {
        total: 63,
        '01': 20,
        '02': 21,
        '03': 22,
      },
      '2016': {
        total: 93,
        '01': 30,
        '02': 31,
        '03': 32,
      },
    },
  }))
    .toEqual([
      { year: 2016, value: 93 },
      { year: 2017, value: 0 },
      { year: 2018, value: 63 },
    ]);
});