jest.mock('../slackNotification');
const { slackError } = require('../slackNotification');
slackError.mockImplementation(() => {
  throw new Error('mocked slackError');
});

const { getActivityData } = require('./utils');

function makeSegmentEffortsInput(segmentIds) {
  return segmentIds.map((id) => ({
    id: 123,
    elapsed_time: 234,
    moving_time: 345,
    start_date_local: '2019-12-07T18:56:13.023Z',
    segment: {
      id,
    },
  }));
}

function makeSegmentEffortsOutput(num) {
  const arr = new Array(num);
  arr.fill({
    _id: 123,
    elapsed_time: 234,
    moving_time: 345,
    start_date_local: '2019-12-07T18:56:13.023Z',
  });
  return arr;
}

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
  expect(replaceAddedDate(getActivityData({
    id: 123,
    athlete: {
      id: 234,
    },
    start_date_local: '2019-12-07T18:56:13.023Z',
    // Includes partial lap at beginning and end
    segment_efforts: makeSegmentEffortsInput(segmentIds),
  }))).toEqual({
    _id: 123,
    added_date,
    athlete_id: 234,
    laps: 3,
    segment_efforts: makeSegmentEffortsOutput(2),
    source: 'refresh',
    start_date_local: '2019-12-07T18:56:13.023Z',
  });
});
