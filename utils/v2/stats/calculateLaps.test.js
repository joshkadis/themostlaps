const {
  getSegmentSequences,
  countFilteredLaps: _count,
} = require('./calculateLaps');

const BOUNDARY_SEGMENTS = [10, 20, 30];

const countFilteredLaps = (filteredSegmentIds) => _count(
  filteredSegmentIds,
  BOUNDARY_SEGMENTS,
);

test('determines number of laps from array of segment IDs', () => {
  expect(countFilteredLaps([])).toEqual(0);

  expect(countFilteredLaps([10, 30])).toEqual(0);

  expect(countFilteredLaps([10, 20, 30])).toEqual(1);

  expect(countFilteredLaps([10, 20, 10, 20, 30, 10, 30])).toEqual(1);

  expect(countFilteredLaps(
    [10, 20, 30, 10, 20, 30, 20, 10, 20, 30, 20],
  )).toEqual(3);

  expect(countFilteredLaps([10, 10, 10, 20, 30, 10, 30, 10])).toEqual(1);
});

test('getSegmentSequences', () => {
  expect(getSegmentSequences(5313629)).toStrictEqual([
    [613198, 4435603, 4362776, 9699985],
    [4435603, 4362776, 9699985, 740668],
    [4362776, 9699985, 740668, 613198],
    [9699985, 740668, 613198, 4435603],
    [740668, 613198, 4435603, 4362776],
  ]);
});
