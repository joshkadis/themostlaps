jest.mock('../slackNotification');
const { slackError } = require('../slackNotification');
slackError.mockImplementation(() => {
  throw new Error('mocked slackError');
});

const { getActivityData } = require('./utils');

test('calculates laps from API response for activity', () => {
  function getActivityDataNoSegmentEfforts() {
    getActivityData({
      id: 123,
      athlete: {
        id: 234,
      },
      start_date_local: '2019-12-07T18:56:13.023Z',
      segment_efforts: [],
    });
  }
  // Activity with no segment efforts whatsoever should trigger slackError
  expect(getActivityDataNoSegmentEfforts).toThrow('mocked slackError');

  // Activity without relevant segment efforts should return false
  // @todo Should return 0?
  expect(getActivityData({
    id: 123,
    athlete: {
      id: 234,
    },
    start_date_local: '2019-12-07T18:56:13.023Z',
    segment_efforts: [{ segment: { id: 1234 } }],
  })).toEqual(false);
});
