const { riderHasLapsAnywhere } = require('./athleteHelpersClient');

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
