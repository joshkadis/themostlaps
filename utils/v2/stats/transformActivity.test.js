const cpConfig = require('../../../config/locations/centralpark');
const ppConfig = require('../../../config/locations/prospectpark');

const {
  filterSegmentEfforts,
  getlapDefinitionsIds,
  getAllSegmentIdsForLocation,
} = require('./transformActivity');
const {
  calculateLapsFromDefinitions,
  calculateLapsFromSegmentEfforts,
} = require('./calculateLaps');

const getIncrementedTimestamp = (idx) => `2018-02-${10 + idx * 2}T16:12:41Z`;
const makeEfforts = (ids) => ids
  .map((id, idx) => ({
    segment: { id },
    start_date: getIncrementedTimestamp(idx),
  }));


test('getlapDefinitionsIds', () => {
  expect(getlapDefinitionsIds('prospectpark')).toStrictEqual([]);
  const actualCpIds = getlapDefinitionsIds('centralpark');
  actualCpIds.sort();
  const expectedCpIds = [
    849072,
    7169109,
    11938517,
    1397141,
    643782,
    3911767,
    12540076,
    1541329,
    9258510,
    20604213,
    4056892,
    7848923,
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
    11938517,
    12540076,
    1541329,
    9258510,
    20604213,
    4056892,
    643782,
    7848923,
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

test('filters segment efforts by location', () => {
  const allEfforts = makeEfforts([
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
  expect(filterSegmentEfforts(allEfforts, ['prospectpark']))
    .toStrictEqual({
      prospectpark: {
        canonicalSegmentEfforts: [
          {
            segment: { id: 5313629 },
            start_date: getIncrementedTimestamp(2),
          },
          {
            segment: { id: 5313629 },
            start_date: getIncrementedTimestamp(8),
          },
        ],
        relevantSegmentEfforts: allEfforts,
        lapDefinitionsSegmentEfforts: [],
      },
    });

  const allEffortsWithDupes = makeEfforts([
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
  ]);
  allEffortsWithDupes[3].start_date = allEffortsWithDupes[2].start_date;
  allEffortsWithDupes[11].start_date = allEffortsWithDupes[10].start_date;
  const filtered = filterSegmentEfforts(allEffortsWithDupes);

  // Should have filtered out two segments, one of which is canonical
  expect(filtered.prospectpark.canonicalSegmentEfforts.length).toEqual(2);
  expect(filtered.prospectpark.relevantSegmentEfforts.length).toEqual(12);
  expect(filtered)
    .toStrictEqual({
      prospectpark: {
        canonicalSegmentEfforts: [
          {
            segment: { id: 5313629 },
            start_date: getIncrementedTimestamp(2),
          },
          {
            segment: { id: 5313629 },
            start_date: getIncrementedTimestamp(9),
          },
        ],
        relevantSegmentEfforts: allEffortsWithDupes.filter(
          (effort, idx) => idx !== 3 && idx !== 11,
        ),
        lapDefinitionsSegmentEfforts: [],
      },
      centralpark: {
        canonicalSegmentEfforts: [],
        relevantSegmentEfforts: [],
        lapDefinitionsSegmentEfforts: [],
      },
    });
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
    7848923, // Start of Cental Park
    1786662,
    1532085,
    12540076,
    12540076,
    7848923,
    1532085,
    1786662,
    12540076,
    1532085,
    12540076,
    7848923,
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

  // Prospect Park does not use lap definitions method
  expect(actualPP).toStrictEqual({
    relevantSegmentEfforts: allEfforts.filter(
      (effort, idx) => idx !== 3 && idx !== 11 && getAllSegmentIdsForLocation('centralpark').indexOf(effort.segment.id) === -1,
    ),
    canonicalSegmentEfforts: allEfforts.filter(
      (effort, idx) => effort.segment.id === ppConfig.canonicalSegmentId
        && idx !== 3,
    ),
    lapDefinitionsSegmentEfforts: [],
  });
  expect(calculateLapsFromSegmentEfforts(
    actualPP.relevantSegmentEfforts,
    2,
    ppConfig.canonicalSegmentId,
  )).toEqual(3);

  // Central Park uses lap definitions method
  expect(actualCP).toStrictEqual({
    relevantSegmentEfforts: allEfforts.filter(
      (effort, idx) => idx !== 18 && getAllSegmentIdsForLocation('prospectpark').indexOf(effort.segment.id) === -1,
    ),
    canonicalSegmentEfforts: allEfforts.filter(
      (effort) => effort.segment.id === cpConfig.canonicalSegmentId,
    ),
    lapDefinitionsSegmentEfforts: allEfforts.filter(
      (effort, idx) => idx !== 18
        && effort.segment.id !== cpConfig.canonicalSegmentId
        && getAllSegmentIdsForLocation('centralpark').indexOf(effort.segment.id) >= 0,
    ),
  });
  expect(calculateLapsFromDefinitions(
    actualCP.lapDefinitionsSegmentEfforts,
    cpConfig,
  )).toEqual(3);
});
