const _cloneDeep = require('lodash/cloneDeep');
const { activityCouldHaveLaps } = require('./utils');

describe('activityCouldHaveLaps edge cases', () => {
  const ppCenter = [40.661990, -73.969681];
  const baseValidActivity = {
    id: 123,
    type: 'ride',
    trainer: false,
    manual: false,
    start_latlng: ppCenter, // Just use park center
    end_latlng: ppCenter,
    distance: 10000,
  };
  let activity = {};

  beforeEach(() => {
    activity = _cloneDeep(baseValidActivity);
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
    // Start with valid activity
    expect(activityCouldHaveLaps(activity))
      .toBe(true);

    // Shorter than any of the locations
    activity.distance = 10;
    expect(activityCouldHaveLaps(activity))
      .toBe(false);

    // Longer than one location
    activity.distance = 7000;
    expect(activityCouldHaveLaps(activity))
      .toBe(true);

    // Waiting for distance to be provided by API
    delete activity.distance;
    expect(activityCouldHaveLaps(activity))
      .toBe(true);
  });

  test('starts or ends within allowed radius', () => {
    const boston = [42.360081, -71.058884];
    // start yes, end no
    activity = {
      ...baseValidActivity,
      start_latlng: ppCenter,
      end_latlng: boston,
    };
    expect(activityCouldHaveLaps(activity)).toBe(true);
    delete activity.end_latlng;
    expect(activityCouldHaveLaps(activity)).toBe(true);

    // start no, end yes
    activity = {
      ...baseValidActivity,
      end_latlng: ppCenter,
      start_latlng: boston,
    };
    expect(activityCouldHaveLaps(activity)).toBe(true);
    delete activity.start_latlng;
    expect(activityCouldHaveLaps(activity)).toBe(true);

    // start no, end no
    activity = {
      ...baseValidActivity,
      start_latlng: boston,
      end_latlng: boston,
    };
    expect(activityCouldHaveLaps(activity)).toBe(false);

    // Activity should still be checked when latlngs are present
    delete activity.end_latlng;
    delete activity.start_latlng;
    expect(activityCouldHaveLaps(activity)).toBe(true);
  });
});
