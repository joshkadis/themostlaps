const {
  requestParamsAreValid,
} = require('./ranking');

test('ranking parameters validation', () => {
  expect(requestParamsAreValid({
    location: 'prospectpark',
  })).toBe(true);

  expect(requestParamsAreValid({
    location: 'notpark',
  })).toBe(false);

  expect(requestParamsAreValid({
    location: 'prospectpark',
    reqPrimary: 'single',
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
