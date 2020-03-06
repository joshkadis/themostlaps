const { filterParamsToLowerCase } = require('./');

test('filterParamsToLowerCase', () => {
  expect(filterParamsToLowerCase({})).toStrictEqual({});

  expect(filterParamsToLowerCase({
    location: 'prospectPark',
  })).toStrictEqual({
    location: 'prospectpark',
  });

  expect(filterParamsToLowerCase({
    location: 'prospectPark',
    reqPrimary: undefined,
    reqSecondary: undefined,
  })).toStrictEqual({
    location: 'prospectpark',
  });

  expect(filterParamsToLowerCase({
    location: 'prospectPark',
    reqPrimary: 'defined',
    reqSecondary: undefined,
  })).toStrictEqual({
    location: 'prospectpark',
    reqPrimary: 'defined',
  });

  expect(filterParamsToLowerCase({
    location: 'prospectPark',
    reqPrimary: '2012',
    reqSecondary: '02',
  })).toStrictEqual({
    location: 'prospectpark',
    reqPrimary: '2012',
    reqSecondary: '02',
  });
});
