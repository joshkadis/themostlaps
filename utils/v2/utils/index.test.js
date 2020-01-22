const { sortUniq } = require('./');

test('sortUniq', () => {
  const locationsData = {
    centralpark: {
      availableYears: [2012, 2014, 2017],
    },
    prospectPark: {
      availableYears: [2012, 2014, 2015, 2018],
    },
  };

  expect(sortUniq([
    ...locationsData.centralpark.availableYears,
    ...locationsData.prospectPark.availableYears,
  ]))
    .toEqual([2012, 2014, 2015, 2017, 2018]);
});
