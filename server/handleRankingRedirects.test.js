const {
  requestParamsAreValid,
} = require('./handleRankingRedirects');

test('ranking parameters validation', () => {
  expect(requestParamsAreValid({
    location: 'PROSPECTpark',
  })).toBe(true);

  expect(requestParamsAreValid({
    location: 'notpark',
  })).toBe(false);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: 'single',
  })).toBe(true);

  // Should be case-insensitive
  expect(requestParamsAreValid({
    location: 'prospectPark',
    reqPrimary: 'SinGlE',
  })).toBe(true);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: 'single',
    reqSecondary: '12',
  })).toBe(false);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: '2019',
  })).toBe(true);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: 'aa2019',
  })).toBe(false);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: '2019',
    reqSecondary: '111',
  })).toBe(false);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: '2002',
  })).toBe(false);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: '2019',
    reqSecondary: '12',
  })).toBe(true);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: '2019',
    reqSecondary: '13',
  })).toBe(false);
});
