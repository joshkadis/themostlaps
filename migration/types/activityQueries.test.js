const {
  dateIsDst,
  getISODateTimeFromLocal,
} = require('./activityQueries');

test('dateIsDst', () => {
  expect(dateIsDst(20180311)).toBeTruthy();
  expect(dateIsDst(20181103)).toBeTruthy();
  expect(dateIsDst(20140430)).toBeTruthy();
  expect(dateIsDst(20080430)).toBeFalsy();
  expect(dateIsDst(20180310)).toBeFalsy();
  expect(dateIsDst(20181105)).toBeFalsy();
  expect(dateIsDst(20141130)).toBeFalsy();
})

test('getISODateTimeFromLocal', () => {
  expect(getISODateTimeFromLocal('2011-04-30T11:35:09Z'))
    .toBe('2011-04-30T11:35:09-04:00');

  expect(getISODateTimeFromLocal('2011-02-30T11:35:09Z'))
    .toBe('2011-02-30T11:35:09-05:00');
});
