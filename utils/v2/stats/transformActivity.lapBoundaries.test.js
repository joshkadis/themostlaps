const cpConfig = require('../../../config/locations/centralpark');
const ppConfig = require('../../../config/locations/prospectpark');

const {
  calculateLapsFromBoundaries,
  filterSegmentEfforts,
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
  )).toEqual(1);

  // We got nothin
  expect(calculateLapsFromBoundaries(
    makeEfforts([123, 12540076, 345, 3911767]),
    cpConfig,
  )).toEqual(0);

  // Enter at Engineers Gate, do a lap, exit E 72nd
  expect(calculateLapsFromBoundaries(
    makeEfforts([1397141, 1532085, 7169109]),
    cpConfig,
  )).toEqual(0);

  // Just boundaries, no canonical
  expect(calculateLapsFromBoundaries(
    makeEfforts([849072, 7169109]),
    cpConfig,
  )).toEqual(1);

  // should only count multiple valid pairs as one lap
  expect(calculateLapsFromBoundaries(
    makeEfforts([849072, 12540076, 1532085, 7169109, 1666631]),
    cpConfig,
  )).toEqual(1);

  // should count valid pair and mismatched pair as one lap
  expect(calculateLapsFromBoundaries(
    makeEfforts([849072, 12540076, 1532085, 20604213, 1666631, 7169109]),
    cpConfig,
  )).toEqual(1);

  // overlapping pairs with same end segment
  expect(calculateLapsFromBoundaries(
    makeEfforts([
      10633522,
      1786662,
      12540076,
      12540076,
      10633522,
      1786662,
      12540076,
      12540076,
      10633522,
      1786662,
      12540076,
      12540076,
    ]),
    cpConfig,
  )).toEqual(3);


  // kitchen sink
  const ids = [
    849072, // first start
    1532085,
    9258510,
    12540076,
    1397141,
    1532085,
    1541329,
    849072, // second start
    20604213,
    1541329,
    7169109, // first end
    1532085,
    9258510,
    12540076,
    849072, // third start
    1532085,
    3911767,
    7169109, // second end
    1532085,
    9258510,
    12540076,
    7169109, // third end
  ];
  expect(calculateLapsFromBoundaries(
    makeEfforts(ids),
    cpConfig,
  )).toEqual(2);
});

test('filters segment efforts with both methods', () => {
  // Use some PP segments, some CP segments, some dupes
  const allEfforts = makeEfforts([
    740668,
    613198,
    5313629,
    5313629,
    4435603,
    4362776,
    9699985,
    740668,
    613198,
    5313629,
    4435603,
    4435603,
    4362776,
    9699985,
    10633522,
    1786662,
    1532085,
    12540076,
    12540076,
    10633522,
    1532085,
    1786662,
    12540076,
    1532085,
    12540076,
    10633522,
    1786662,
    12540076,
    12540076,
    1532085,
  ]);
  allEfforts[3].start_date = allEfforts[2].start_date;
  allEfforts[11].start_date = allEfforts[10].start_date;
  allEfforts[18].start_date = allEfforts[17].start_date;
  const {
    prospectpark: actualPP,
    centralpark: actualCP,
  } = filterSegmentEfforts(allEfforts);

  // Prospect Park does not use lap boundaries method
  expect(actualPP.lapBoundariesSegmentEfforts.length).toEqual(0);
  expect(
    calculateLapsFromBoundaries(
      actualPP.lapBoundariesSegmentEfforts,
      ppConfig,
    ),
  ).toEqual(0);
  // Prospect Park uses section segments method
  expect(actualPP.relevantSegmentEfforts).toStrictEqual(
    // relevantSegmentEfforts should be deduped
    allEfforts.filter(
      (effort, idx) => idx !== 3 && idx !== 11 && idx !== 18,
    ),
  );
});
