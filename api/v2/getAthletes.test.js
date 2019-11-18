const { getV2AthleteStats } = require('./getAthletes');

test('getV2AthleteStats', () => {
  const athlete = {
    name: 'Jan',
    stats: {
      single: 1,
      allTime: 1,
      _2017: 1,
      _2017_03: 1,
    },
  };

  expect(getV2AthleteStats(athlete).stats)
    .toEqual({
      locations: {
        prospectpark: {
          availableYears: [2017],
          allTime: 1,
          single: 1,
          byYear: [
            { year: 2017, value: 1 },
          ],
          byMonth: {
            2017: [
              { month: 'Jan', value: 0 },
              { month: 'Feb', value: 0 },
              { month: 'Mar', value: 1 },
              { month: 'Apr', value: 0 },
              { month: 'May', value: 0 },
              { month: 'Jun', value: 0 },
              { month: 'Jul', value: 0 },
              { month: 'Aug', value: 0 },
              { month: 'Sep', value: 0 },
              { month: 'Oct', value: 0 },
              { month: 'Nov', value: 0 },
              { month: 'Dec', value: 0 },
            ],
          },
        },
      },
    });

  athlete.stats = {
    single: 1,
    allTime: 3,
    _2015: 2,
    _2015_04: 1,
    _2015_05: 1,
    _2017: 1,
    _2017_03: 1,
    locations: {
      centralpark: {
        single: 1,
        allTime: 1,
        _2017: 1,
        _2017_03: 1,
      },
    },
  };

  expect(getV2AthleteStats(athlete).stats)
    .toEqual({
      locations: {
        centralpark: {
          availableYears: [2017],
          allTime: 1,
          single: 1,
          byYear: [
            { year: 2017, value: 1 },
          ],
          byMonth: {
            2017: [
              { month: 'Jan', value: 0 },
              { month: 'Feb', value: 0 },
              { month: 'Mar', value: 1 },
              { month: 'Apr', value: 0 },
              { month: 'May', value: 0 },
              { month: 'Jun', value: 0 },
              { month: 'Jul', value: 0 },
              { month: 'Aug', value: 0 },
              { month: 'Sep', value: 0 },
              { month: 'Oct', value: 0 },
              { month: 'Nov', value: 0 },
              { month: 'Dec', value: 0 },
            ],
          },
        },
        prospectpark: {
          availableYears: [2015, 2017],
          allTime: 3,
          single: 1,
          byYear: [
            { year: 2015, value: 2 },
            { year: 2017, value: 1 },
          ],
          byMonth: {
            2015: [
              { month: 'Jan', value: 0 },
              { month: 'Feb', value: 0 },
              { month: 'Mar', value: 0 },
              { month: 'Apr', value: 1 },
              { month: 'May', value: 1 },
              { month: 'Jun', value: 0 },
              { month: 'Jul', value: 0 },
              { month: 'Aug', value: 0 },
              { month: 'Sep', value: 0 },
              { month: 'Oct', value: 0 },
              { month: 'Nov', value: 0 },
              { month: 'Dec', value: 0 },
            ],
            2017: [
              { month: 'Jan', value: 0 },
              { month: 'Feb', value: 0 },
              { month: 'Mar', value: 1 },
              { month: 'Apr', value: 0 },
              { month: 'May', value: 0 },
              { month: 'Jun', value: 0 },
              { month: 'Jul', value: 0 },
              { month: 'Aug', value: 0 },
              { month: 'Sep', value: 0 },
              { month: 'Oct', value: 0 },
              { month: 'Nov', value: 0 },
              { month: 'Dec', value: 0 },
            ],
          },
        },
      },
    });

  athlete.stats = {
    locations: {
      centralpark: {
        single: 1,
        allTime: 1,
        _2017: 1,
        _2017_03: 1,
      },
      prospectpark: {
        single: 1,
        allTime: 1,
        _2017: 1,
        _2017_03: 1,
      },
    },
  };

  expect(getV2AthleteStats(athlete).stats)
    .toEqual({
      locations: {
        centralpark: {
          availableYears: [2017],
          allTime: 1,
          single: 1,
          byYear: [
            { year: 2017, value: 1 },
          ],
          byMonth: {
            2017: [
              { month: 'Jan', value: 0 },
              { month: 'Feb', value: 0 },
              { month: 'Mar', value: 1 },
              { month: 'Apr', value: 0 },
              { month: 'May', value: 0 },
              { month: 'Jun', value: 0 },
              { month: 'Jul', value: 0 },
              { month: 'Aug', value: 0 },
              { month: 'Sep', value: 0 },
              { month: 'Oct', value: 0 },
              { month: 'Nov', value: 0 },
              { month: 'Dec', value: 0 },
            ],
          },
        },
        prospectpark: {
          availableYears: [2017],
          allTime: 1,
          single: 1,
          byYear: [
            { year: 2017, value: 1 },
          ],
          byMonth: {
            2017: [
              { month: 'Jan', value: 0 },
              { month: 'Feb', value: 0 },
              { month: 'Mar', value: 1 },
              { month: 'Apr', value: 0 },
              { month: 'May', value: 0 },
              { month: 'Jun', value: 0 },
              { month: 'Jul', value: 0 },
              { month: 'Aug', value: 0 },
              { month: 'Sep', value: 0 },
              { month: 'Oct', value: 0 },
              { month: 'Nov', value: 0 },
              { month: 'Dec', value: 0 },
            ],
          },
        },
      },
    });
});
