const cpConfig = require('../../../config/locations/centralpark');
// const ppConfig = require('../../../config/locations/prospectpark');

const {
  getSegmentSequences,
  countFilteredLaps: _count,
  calculateLapsFromSegmentEfforts,
  calculateLapsFromDefinitions,
} = require('./calculateLaps');

const BOUNDARY_SEGMENTS = [10, 20, 30];

const countFilteredLaps = (filteredSegmentIds) => _count(
  filteredSegmentIds,
  BOUNDARY_SEGMENTS,
);

// Copied from transformActivity.test.js
const getIncrementedTimestamp = (idx) => `2018-02-${10 + idx * 2}T16:12:41Z`;
const makeEfforts = (ids) => ids
  .map((id, idx) => ({
    segment: { id },
    start_date: getIncrementedTimestamp(idx),
  }));

test('calculateLapsFromSegmentEfforts', () => {
  // All partial segments surrounding 2 canonical laps => 3 laps
  let allEfforts = makeEfforts([
    740668,
    613198,
    5313629,
    4435603,
    4362776,
    9699985,
    740668,
    613198,
    5313629,
    4435603,
    4362776,
    9699985,
  ]);
  expect(calculateLapsFromSegmentEfforts(allEfforts, 2, 5313629))
    .toEqual(3);

  // 4 of 5 partial segments surrounding 2 canonical laps => 3 laps
  allEfforts = makeEfforts([
    613198,
    5313629,
    4435603,
    4362776,
    9699985,
    740668,
    613198,
    5313629,
    4435603,
    4362776,
    9699985,
  ]);
  expect(calculateLapsFromSegmentEfforts(allEfforts, 2, 5313629))
    .toEqual(3);

  // 3 of 5 partial segments surrounding 2 canonical laps => 2 laps
  allEfforts = makeEfforts([
    613198,
    5313629,
    4435603,
    4362776,
    9699985,
    740668,
    613198,
    5313629,
    4435603,
    4362776,
  ]);
  expect(calculateLapsFromSegmentEfforts(allEfforts, 2, 5313629))
    .toEqual(2);

  // 4 of 5 partial segments surrounding 1 canonical laps => 2 laps
  allEfforts = makeEfforts([
    613198,
    5313629,
    4435603,
    4362776,
    9699985,
  ]);
  expect(calculateLapsFromSegmentEfforts(allEfforts, 1, 5313629))
    .toEqual(2);

  // 3 of 5 partial segments surrounding 1 canonical laps => 1 laps
  allEfforts = makeEfforts([
    613198,
    5313629,
    4435603,
    4362776,
  ]);
  expect(calculateLapsFromSegmentEfforts(allEfforts, 1, 5313629))
    .toEqual(1);

  // 4 of 5 partial segments surrounding 0 canonical laps => 1 laps
  allEfforts = makeEfforts([
    613198,
    4435603,
    4362776,
    9699985,
  ]);
  expect(calculateLapsFromSegmentEfforts(allEfforts, 0, 5313629))
    .toEqual(1);

  // 3 of 5 partial segments surrounding 0 canonical laps => 0 laps
  allEfforts = makeEfforts([
    613198,
    4435603,
    4362776,
  ]);
  expect(calculateLapsFromSegmentEfforts(allEfforts, 0, 5313629))
    .toEqual(0);
});

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


test('calculates laps using the lapDefinitions method', () => {
  // basic example
  expect(calculateLapsFromDefinitions(
    makeEfforts([849072, 12540076, 7169109]),
    cpConfig,
  )).toEqual(1);

  // We got nothin
  expect(calculateLapsFromDefinitions(
    makeEfforts([123, 12540076, 345, 1541329]),
    cpConfig,
  )).toEqual(0);

  // Enter at Engineers Gate, do a lap, exit E 72nd
  expect(calculateLapsFromDefinitions(
    makeEfforts([11938517, 1541329, 7169109]),
    cpConfig,
  )).toEqual(1);

  // should only count multiple valid definition sets as one lap
  expect(calculateLapsFromDefinitions(
    makeEfforts([849072, 12540076, 4056892, 7169109, 12540076]),
    cpConfig,
  )).toEqual(1);

  // should count valid set and mismatched set as one lap
  expect(calculateLapsFromDefinitions(
    makeEfforts([849072, 12540076, 1532085, 20604213, 3911767, 7169109]),
    cpConfig,
  )).toEqual(1);

  // overlapping sets with same end segment
  expect(calculateLapsFromDefinitions(
    makeEfforts([
      7848923,
      1786662,
      12540076,
      12540076,
      7848923,
      1786662,
      12540076,
      12540076,
      7848923,
      1786662,
      12540076,
      12540076,
    ]),
    cpConfig,
  )).toEqual(3);


  // kitchen sink
  const ids = [
    849072, // incomplete start
    849072, // first start
    1532085,
    9258510,
    12540076,
    1397141,
    1532085,
    7169109, // first end
    1541329,
    849072, // second start
    20604213,
    1541329,
    12540076,
    7169109, // first end
    1532085,
    9258510,
    849072, // third start
    1532085,
    3911767,
    1532085,
    9258510,
    12540076,
    7169109, // third end
    9258510,
    12540076, // incomplete lap segment 2
    1397141,
    1532085,
    7169109, // incomplete lap segment 3
  ];
  expect(calculateLapsFromDefinitions(
    makeEfforts(ids),
    cpConfig,
  )).toEqual(3);
});
