const {
  lapSegmentId,
} = require('../../config');

const { incrementDate } = require('./utils');

const {
  getActivityData,
  filterSegmentEfforts,
} = require('./utils');
const calculateLapsFromSegmentEfforts = require('./calculateLapsFromSegmentEfforts');

function makeSegmentEffortsInput(segmentIds, options = {}) {
  const defaults = {
    id: 123,
    elapsed_time: 234,
    moving_time: 345,
    start_date_local: '2019-12-07T18:56:13.023Z',
  };
  return segmentIds.map((id) => ({
    ...defaults,
    ...options,
    segment: {
      id,
    },
  }));
}

function makeSegmentEffortsOutput(num, options = {}) {
  const arr = new Array(num);
  arr.fill({
    _id: 123,
    elapsed_time: 234,
    moving_time: 345,
    start_date_local: '2019-12-07T18:56:13.023Z',
    ...options,
  });
  return arr;
}

test('uses filterSegmentEfforts() to filter, dedupe, and format', () => {
  // 2 same inputs => 1 outputs
  let input = makeSegmentEffortsInput([lapSegmentId, lapSegmentId]);
  let expected = makeSegmentEffortsOutput(1);
  expect(input.length).toBe(2);
  expect(expected.length).toBe(1);
  expect(filterSegmentEfforts(input)).toStrictEqual(expected);

  // 2 same inputs, 1 new input => 2 outputs
  input = [
    ...input,
    ...makeSegmentEffortsInput(
      [lapSegmentId],
      { start_date_local: '2019-12-07T19:06:13.023Z' },
    ),
  ];

  expected = [
    ...expected,
    ...makeSegmentEffortsOutput(
      1,
      { start_date_local: '2019-12-07T19:06:13.023Z' },
    ),
  ];
  expect(input.length).toBe(3);
  expect(expected.length).toBe(2);
  expect(filterSegmentEfforts(input)).toStrictEqual(expected);

  // 2 same inputs, 1 new input, 2 same inputs => 3 outputs
  input = [
    ...input,
    ...makeSegmentEffortsInput(
      [lapSegmentId, lapSegmentId],
      { start_date_local: '2019-12-07T19:16:13.023Z' },
    ),
  ];

  expected = [
    ...expected,
    ...makeSegmentEffortsOutput(
      1,
      { start_date_local: '2019-12-07T19:16:13.023Z' },
    ),
  ];
  expect(input.length).toBe(5);
  expect(expected.length).toBe(3);
  expect(filterSegmentEfforts(input)).toStrictEqual(expected);
});

test('calculates laps from API response for activity', () => {
  const stripSecondsRegex = /:\d{2}\.\d{3}Z$/;
  const added = new Date();
  const added_date = added.toISOString()
    .replace(stripSecondsRegex, '');

  // Checks added_date to nearest minute
  const replaceAddedDate = (obj) => ({
    ...obj,
    added_date: obj.added_date.replace(stripSecondsRegex, ''),
  });

  // No segment efforts
  expect(replaceAddedDate(getActivityData({
    id: 123,
    athlete: {
      id: 234,
    },
    start_date_local: '2019-12-07T18:56:13.023Z',
    segment_efforts: [],
  }))).toEqual({
    _id: 123,
    added_date,
    athlete_id: 234,
    laps: 0,
    segment_efforts: [],
    source: 'refresh',
    start_date_local: '2019-12-07T18:56:13.023Z',
  });

  // Irrelevant segment efforts
  expect(replaceAddedDate(getActivityData({
    id: 123,
    athlete: {
      id: 234,
    },
    start_date_local: '2019-12-07T18:56:13.023Z',
    segment_efforts: [{ segment: { id: 1234 } }],
  }))).toEqual({
    _id: 123,
    added_date,
    athlete_id: 234,
    laps: 0,
    segment_efforts: [],
    source: 'refresh',
    start_date_local: '2019-12-07T18:56:13.023Z',
  });

  // Include segment efforts for actual laps
  const segmentIds = [
    123,
    // Beginning partial lap
    613198,
    4435603,
    // Full lap 1
    5313629,
    613198,
    4435603,
    234,
    4362776,
    9699985,
    740668,
    // Full lap 2
    5313629,
    613198,
    4435603,
    234,
    4362776,
    9699985,
    740668,
    // End of partial lap
    234,
    4362776,
    9699985,
    740668,
  ];
  const rawEfforts = makeSegmentEffortsInput(segmentIds);
  // The two full laps shouldn't be duplicates w same start time
  rawEfforts[3].start_date_local = '2019-12-07T18:46:13.023Z';

  expect(filterSegmentEfforts(rawEfforts).length)
    .toEqual(2);

  expect(calculateLapsFromSegmentEfforts(rawEfforts, 2))
    .toEqual(3);

  expect(replaceAddedDate(getActivityData({
    id: 123,
    athlete: {
      id: 234,
    },
    start_date_local: '2019-12-07T18:56:13.023Z',
    // Includes partial lap at beginning and end
    segment_efforts: rawEfforts,
  }))).toEqual({
    _id: 123,
    added_date,
    athlete_id: 234,
    laps: 3,
    // efforts for canonical segment are deduped
    segment_efforts: [
      ...makeSegmentEffortsOutput(1, { start_date_local: '2019-12-07T18:46:13.023Z' }),
      ...makeSegmentEffortsOutput(1),
    ],
    source: 'refresh',
    start_date_local: '2019-12-07T18:56:13.023Z',
  });
});

test('incrementDate', () => {
  expect(incrementDate('2007-09-15T08:15:29Z', 604800000)).toEqual('2007-09-22T08:15:29Z');
  expect(incrementDate(new Date('2007-09-15T08:15:29Z'), 604800000)).toEqual('2007-09-22T08:15:29Z');

  expect(incrementDate('2007-09-15T08:15:29Z')).toEqual('2007-09-15T08:15:29Z');
  expect(incrementDate(new Date('2007-09-15T08:15:29Z'))).toEqual('2007-09-15T08:15:29Z');
});
