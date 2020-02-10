const {
  getSegmentSequences,
  calculateLapsFromSegmentEfforts,
  filterSegmentEfforts,
} = require('./transformActivity');

const getIncrementedTimestamp = (idx) => `2018-02-${10 + idx * 2}T16:12:41Z`;
const makeEfforts = (ids) => ids
  .map((id, idx) => ({
    segment: { id },
    start_date: getIncrementedTimestamp(idx),
  }));

// lapSegmentId: 5313629, // Prospect Park Race Lap
// sectionSegmentIds: [
//   613198, // Prospect Park hill
//   4435603, // Top of Prospect Park
//   4362776, // Prospect Pure Downhill
//   9699985, // Sprint between the lights
//   740668, // E Lake Drive
// ],
//
test('getSegmentSequences', () => {
  expect(getSegmentSequences(5313629)).toStrictEqual([
    [613198, 4435603, 4362776, 9699985],
    [4435603, 4362776, 9699985, 740668],
    [4362776, 9699985, 740668, 613198],
    [9699985, 740668, 613198, 4435603],
    [740668, 613198, 4435603, 4362776],
  ]);
});

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
        lapBoundariesSegmentEfforts: [],
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
        lapBoundariesSegmentEfforts: [],
      },
      centralpark: {
        canonicalSegmentEfforts: [],
        relevantSegmentEfforts: [],
        lapBoundariesSegmentEfforts: [],
      },
    });
});
