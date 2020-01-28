const { activityCouldHaveLaps } = require('./utils');

describe('activityCouldHaveLaps edge cases', () => {
  const baseValidActivity = {
    id: 123,
    type: 'ride',
    trainer: false,
    manual: false,
    start_latlng: [40.661990, -73.969681], // Just use park center
    end_latlng: [40.661990, -73.969681],
    distance: 10000,
  };
  let activity = {};

  beforeEach(() => {
    activity = { ...baseValidActivity };
    expect(activityCouldHaveLaps(activity)).toBe(true);
  });

  test('baseValidActivity is valid', () => {
    expect(activityCouldHaveLaps(baseValidActivity)).toBe(true);
  });

  test('has id', () => {
    delete activity.id;
    expect(activityCouldHaveLaps(activity)).toBe(false);
  });

  test('has type and is ride', () => {
    activity.type = 'run';
    expect(activityCouldHaveLaps(activity)).toBe(false);
    delete activity.type;
    expect(activityCouldHaveLaps(activity)).toBe(true);
  });

  test('has manual and is not manual', () => {
    activity.manual = true;
    expect(activityCouldHaveLaps(activity)).toBe(false);
    delete activity.manual;
    expect(activityCouldHaveLaps(activity)).toBe(true);
  });

  test('has trainer and is not trainer', () => {
    activity.trainer = true;
    expect(activityCouldHaveLaps(activity)).toBe(false);
    delete activity.trainer;
    expect(activityCouldHaveLaps(activity)).toBe(true);
  });

  test('has distance and not less than min distance', () => {
    activity.distance = 0;
    expect(activityCouldHaveLaps(activity)).toBe(false);
    delete activity.distance;
    expect(activityCouldHaveLaps(activity)).toBe(true);
  });
});
