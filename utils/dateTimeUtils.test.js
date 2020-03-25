const {
  getMonthKey,
  timePartString,
  getMonthName,
  isValidYear,
  isValidMonth,
} = require('./dateTimeUtils');

test('timePartString', () => {
  expect(timePartString('01')).toEqual('01');
  expect(timePartString(1)).toEqual('01');
  expect(timePartString(1.0)).toEqual('01');
  expect(timePartString('12')).toEqual('12');
  expect(timePartString(12)).toEqual('12');
  expect(timePartString(12.0)).toEqual('12');

});

test('getMonthKey()', () => {
  const current = new Date();
  let yearStr = current.getFullYear();
  let monthStr = timePartString(current.getMonth() + 1);

  expect(getMonthKey()).toBe(`_${yearStr}_${monthStr}`);
  expect(getMonthKey(false, '')).toBe(yearStr + monthStr);
  expect(getMonthKey(current, '')).toBe(yearStr + monthStr);

  const past = new Date('2016-05-02T08:41:36Z');
  yearStr = past.getFullYear();
  monthStr = timePartString(past.getMonth() + 1);

  expect(getMonthKey(past)).toBe('_2016_05');
  expect(getMonthKey(past, '+')).toBe('+2016+05');
});

test('getMonthName', () => {
  expect(getMonthName(1)).toEqual('January');
  expect(getMonthName(1, 3)).toEqual('Jan');
});

test('isValidYear', () => {
  expect(isValidYear('12abd')).toEqual(false);
  expect(isValidYear(2009)).toEqual(false);
  expect(isValidYear('2009')).toEqual(false);
  expect(isValidYear(2025)).toEqual(false);
  expect(isValidYear('2025')).toEqual(false);
  expect(isValidYear('2020.0')).toEqual(false);
  expect(isValidYear(2020.0)).toEqual(true);
  expect(isValidYear(2020)).toEqual(true);
  expect(isValidYear(2010)).toEqual(true);
  expect(isValidYear(2015)).toEqual(true);
});

test('isValidMonth', () => {
  expect(isValidMonth()).toEqual(false);
  expect(isValidMonth(0)).toEqual(false);
  expect(isValidMonth('0')).toEqual(false);
  expect(isValidMonth(13)).toEqual(false);
  expect(isValidMonth('13')).toEqual(false);
  expect(isValidMonth('04.0')).toEqual(false);
  expect(isValidMonth(4.0)).toEqual(true);
  expect(isValidMonth(1)).toEqual(true);
  expect(isValidMonth('01')).toEqual(true);
  expect(isValidMonth('1')).toEqual(true);
  expect(isValidMonth(1)).toEqual(true);
  expect(isValidMonth('12')).toEqual(true);
  expect(isValidMonth(12)).toEqual(true);
});
