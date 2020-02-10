const cpConfig = require('../../../config/locations/centralpark');
const ppConfig = require('../../../config/locations/prospectpark');

const {
  calculateLapsFromBoundaries,
  calculateLapsFromSegmentEfforts,
  filterSegmentEfforts,
  getAllSegmentIdsForLocation,
  getLapBoundariesIds,
} = require('./transformActivity');

// Copied from transformActivity.test.js
const getIncrementedTimestamp = (idx) => `2018-02-${10 + idx * 2}T16:12:41Z`;
const makeEfforts = (ids) => ids
  .map((id, idx) => ({
    segment: { id },
    start_date: getIncrementedTimestamp(idx),
  }));

test('getLapBoundariesIds', () => {
  expect(getLapBoundariesIds('prospectpark')).toStrictEqual([]);
  const actualCpIds = getLapBoundariesIds('centralpark');
  actualCpIds.sort();
  const expectedCpIds = [
    849072,
    7169109,
    1397141,
    3911767,
    12540076,
    1666631,
    1541329,
    9258510,
    20604213,
    4056892,
    10633522,
    1786662,
    11938482,
  ];
  expectedCpIds.sort();
  expect(actualCpIds).toEqual(expectedCpIds);
});
test('getAllSegmentIdsForLocation', () => {
  let actual = getAllSegmentIdsForLocation('centralpark');
  actual.sort();
  const cpIds = [
    1532085,
    849072,
    7169109,
    1397141,
    3911767,
    12540076,
    1666631,
    1541329,
    9258510,
    20604213,
    4056892,
    10633522,
    1786662,
    11938482,
  ];
  cpIds.sort();
  expect(actual).toStrictEqual(cpIds);

  actual = getAllSegmentIdsForLocation('prospectpark');
  actual.sort();
  const ppIds = [
    5313629,
    613198, // Prospect Park hill
    4435603, // Top of Prospect Park
    4362776, // Prospect Pure Downhill
    9699985, // Sprint between the lights
    740668, // E Lake Drive
  ];
  ppIds.sort();
  expect(actual).toStrictEqual(ppIds);
});

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
    10633522, // Start of Cental Park
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
  expect(actualPP).toStrictEqual({
    relevantSegmentEfforts: allEfforts.filter(
      (effort, idx) => idx !== 3 && idx !== 11 && getAllSegmentIdsForLocation('centralpark').indexOf(effort.segment.id) === -1,
    ),
    canonicalSegmentEfforts: allEfforts.filter(
      (effort, idx) => effort.segment.id === ppConfig.canonicalSegmentId
        && idx !== 3,
    ),
    lapBoundariesSegmentEfforts: [],
  });
  expect(calculateLapsFromSegmentEfforts(
    actualPP.relevantSegmentEfforts,
    2,
    ppConfig.canonicalSegmentId,
  )).toEqual(3);

  // Central Park uses lap boundaries method
  expect(actualCP).toStrictEqual({
    relevantSegmentEfforts: allEfforts.filter(
      (effort, idx) => idx !== 18 && getAllSegmentIdsForLocation('prospectpark').indexOf(effort.segment.id) === -1,
    ),
    canonicalSegmentEfforts: allEfforts.filter(
      (effort) => effort.segment.id === cpConfig.canonicalSegmentId,
    ),
    lapBoundariesSegmentEfforts: allEfforts.filter(
      (effort, idx) => idx !== 18
        && getAllSegmentIdsForLocation('centralpark').indexOf(effort.segment.id) >= 0
        && effort.segment.id !== cpConfig.canonicalSegmentId,
    ),
  });
  expect(calculateLapsFromBoundaries(
    actualCP.lapBoundariesSegmentEfforts,
    cpConfig,
  )).toEqual(3);
});
