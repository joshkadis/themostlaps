const {
  compileSpecialStats,
  compileGiro2018,
} = require('./compileSpecialStats');

test('compileGiro2018()', () => {
  // OK year and month but day too early
  expect(compileGiro2018(3, '2018-05-02T08:41:36Z', 0))
    .toBe(0);

  // OK month and day but wrong year
  expect(compileGiro2018(3, '2011-05-26T08:41:36Z', 0))
    .toBe(0);

  // Date ok
  expect(compileGiro2018(3, '2018-05-26T08:41:36Z', 0))
    .toBe(3);

  // Rest day
  expect(compileGiro2018(3, '2018-05-14T08:41:36Z', 3))
    .toBe(3);

  // No laps today
  expect(compileGiro2018(0, '2018-05-26T08:41:36Z', 66))
    .toBe(66);

  // Adds laps to existing total
  expect(compileGiro2018(22, '2018-05-26T08:41:36Z', 15))
    .toBe(37);
});

test('compileSpecialStats()', () => {
  // OK year and month but day too early
  expect(compileSpecialStats(4, '2018-05-01T08:41:36Z', {}))
    .toEqual({ giro2018: 0});

  // Date OK, merge into object
  expect(compileSpecialStats(4, '2018-05-04T08:41:36Z', { test: 'string' }))
    .toEqual({ giro2018: 4, test: 'string' });

  // After end of race
  expect(compileSpecialStats(4, '2018-05-29T08:41:36Z', {}))
    .toEqual({ giro2018: 0});

  // Update total and merge
  expect(compileSpecialStats(4, '2018-05-10T08:41:36Z', { giro2018: 9, test: 'string' }))
    .toEqual({ test: 'string', giro2018: 13});
});
