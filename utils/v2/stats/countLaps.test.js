const { countFilteredLaps: _count } = require('./countLaps');

const CANONICAL_ID = 20;
const BOUNDARY_PAIR = [10, 30];

const countFilteredLaps = (filteredSegmentIds) => _count(
  filteredSegmentIds,
  BOUNDARY_PAIR,
  CANONICAL_ID,
);

test('determines number of laps from array of segment IDs', () => {
  expect(countFilteredLaps([])).toEqual(0);

  expect(countFilteredLaps([10, 30])).toEqual(1);

  expect(countFilteredLaps([10, 20, 30])).toEqual(1);

  expect(countFilteredLaps([10, 20, 30, 10, 30])).toEqual(2);

  expect(countFilteredLaps([10, 20, 30, 30, 10, 30])).toEqual(1);

  expect(countFilteredLaps([10, 10, 10, 20, 30, 10, 30, 10])).toEqual(2);
});
