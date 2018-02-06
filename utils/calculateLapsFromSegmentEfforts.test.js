const calculateLapsFromSegmentEfforts =
  require('./calculateLapsFromSegmentEfforts');

const testActivities = require('../test/data/testActivities');

test('calculates laps from segment_efforts array', () => {
  testActivities.forEach(({ segmentEfforts, actual }) => {
    expect(calculateLapsFromSegmentEfforts(segmentEfforts))
      .toBe(actual);
  });
});
