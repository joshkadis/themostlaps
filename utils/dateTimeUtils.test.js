const {
  getMonthKey,
  timePartString,
  getMonthName,
 } = require('./dateTimeUtils');

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
