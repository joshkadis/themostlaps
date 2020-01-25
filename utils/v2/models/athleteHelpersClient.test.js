const {
  riderHasLapsAnywhere,
  riderHasStatsForLocation,
} = require('./athleteHelpersClient');

test('riderHasLapsAnywhere', () => {
  expect(riderHasLapsAnywhere({})).toEqual(false);

  expect(riderHasLapsAnywhere({
    prospectpark: {
      allTime: 0,
    },
  })).toEqual(false);

  expect(riderHasLapsAnywhere({
    prospectpark: {
      allTime: 0,
    },
    centralpark: {
      allTime: 0,
    },
  })).toEqual(false);

  expect(riderHasLapsAnywhere({
    prospectpark: {
      allTime: 9,
    },
    centralpark: {
      allTime: 0,
    },
  })).toEqual(true);

  expect(riderHasLapsAnywhere({
    prospectpark: {
      allTime: 0,
    },
    centralpark: {
      allTime: 9,
    },
  })).toEqual(true);
});

test('riderHasStatsForLocation', () => {
  expect(riderHasStatsForLocation()).toEqual(false);
  // expect(riderHasStatsForLocation({}, '')).toEqual(false);

  expect(riderHasStatsForLocation('what', 'isThis')).toEqual(false);

  expect(riderHasStatsForLocation(
    { prospectpark: true },
    'centralpark',
  )).toEqual(false);
  expect(riderHasStatsForLocation(
    { prospectpark: true },
    'prospectpark',
  )).toEqual(true);
});
