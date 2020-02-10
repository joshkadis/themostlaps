const cpConfig = require('../../../config/locations/centralpark');
const {
  calculateLapsFromBoundaries,
} = require('./transformActivity');

// Copied from transformActivity.test.js
const getIncrementedTimestamp = (idx) => `2018-02-${10 + idx * 2}T16:12:41Z`;
const makeEfforts = (ids) => ids
  .map((id, idx) => ({
    segment: { id },
    start_date: getIncrementedTimestamp(idx),
  }));

test('calculates laps using the lapBoundaries method', () => {
  // basic example
  expect(calculateLapsFromBoundaries(
    makeEfforts([849072, 1532085, 7169109]),
    cpConfig,
  )).toEqual(2);

  // We got nothin
  expect(calculateLapsFromBoundaries(
    makeEfforts([123, 12540076, 345, 3911767]),
    cpConfig,
  )).toEqual(0);

  // Enter at Engineers Gate, do a lap, exit E 72nd
  expect(calculateLapsFromBoundaries(
    makeEfforts([1397141, 1532085, 7169109]),
    cpConfig,
  )).toEqual(1);

  // Just boundaries, no canonical
  expect(calculateLapsFromBoundaries(
    makeEfforts([849072, 7169109]),
    cpConfig,
  )).toEqual(1);

  // should only count multiple valid pairs as one lap
  expect(calculateLapsFromBoundaries(
    makeEfforts([849072, 12540076, 1532085, 7169109, 1666631]),
    cpConfig,
  )).toEqual(2);

  // should count valid pair and mismatched pair as one lap
  expect(calculateLapsFromBoundaries(
    makeEfforts([849072, 12540076, 1532085, 20604213, 1666631]),
    cpConfig,
  )).toEqual(2);

  // kitchen sink
  const ids = [
    849072,
    1397141,
    1532085, // first canonical
    1541329,
    20604213,
    1541329,
    1532085,
    9258510,
    12540076,
    1532085, // last canonical
    3911767,
    7169109,
  ];
  expect(calculateLapsFromBoundaries(
    makeEfforts(ids),
    cpConfig,
  )).toEqual(4);
});
