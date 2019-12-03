const Athlete = require('../../../schema/Athlete');
const LocationIngest = require('./class.LocationIngest');
const cpSegmentEffort = require('./segmentEffort.testData');

let athleteDoc;
let locationIngest;

beforeEach(() => {
  athleteDoc = new Athlete({ _id: 541773 });
  locationIngest = new LocationIngest(athleteDoc, 1532085);
  locationIngest.isMock = true;
});

test('setup class instance', () => {
  expect(athleteDoc instanceof Athlete).toBe(true);
  expect(locationIngest.segmentId).toBe(1532085);
});

test('formats segment effort', () => {
  const actual = locationIngest.formatSegmentEffort(cpSegmentEffort);
  const expected = {
    _id: 53673868572,
    elapsed_time: 773,
    moving_time: 773,
    start_date_local: '2016-08-28T06:16:15Z',
  };

  // Object properties match
  expect(Object.keys(actual).sort())
    .toEqual([...Object.keys(expected), 'startDateUtc'].sort());

  // JS primitive values
  Object.keys(expected).forEach((key) => {
    expect(actual).toHaveProperty(key, expected[key]);
  });

  // Date object matches, accounting for Mongo(ose) formatting
  const actualStartDateUTC = new Date(actual.startDateUtc);
  const expectedStartDateUtc = new Date('2016-08-28T10:16:15Z');
  expect(actualStartDateUTC.toISOString())
    .toEqual(expectedStartDateUtc.toISOString());
});

test('formats activity from segment effort', () => {
  const actual = locationIngest.formatActivity(cpSegmentEffort);
  const expected = {
    _id: 692349426,
    location: 'centralpark',
    start_date_local: '2016-08-28T06:16:15Z',
    athlete_id: cpSegmentEffort.athlete.id,
    laps: 1,
    segmentEfforts: [],
    source: 'signup',
  };

  expect(Object.keys(actual).sort())
    .toEqual([...Object.keys(expected), 'added_date', 'startDateUtc'].sort());

  Object.keys(expected).forEach((key) => {
    expect(actual).toHaveProperty(key, expected[key]);
  });

  expect(actual.coldLapsPoints).toBeUndefined();

  // added_date should be within a few milliseconds of now
  const addedDate = new Date(actual.added_date);
  expect(addedDate.valueOf()).toBeLessThan(Date.now());
  expect(addedDate.valueOf()).toBeGreaterThanOrEqual(Date.now() - 20);

  // Date object matches, accounting for Mongo(ose) formatting
  const actualStartDateUTC = new Date(actual.startDateUtc);
  const expectedStartDateUtc = new Date('2016-08-28T10:16:15Z');
  expect(actualStartDateUTC.toISOString())
    .toEqual(expectedStartDateUtc.toISOString());
});

test('converts segment efforts to Activity model shapes', () => {
  // These should fail gracefully
  locationIngest.processEffort({ isSegmentEffort: 'no' });
  expect(locationIngest.getActivities().length).toEqual(0);

  locationIngest.processEffort({ activity: 'no' });
  expect(locationIngest.getActivities().length).toEqual(0);

  locationIngest.processEffort({ activity: { id: 10 } });
  expect(locationIngest.getActivities().length).toEqual(0);

  // Segment effort processing should succeed
  locationIngest.processEffort(cpSegmentEffort);
  expect(locationIngest.getActivityIds()).toEqual([692349426]);

  const activities = locationIngest.getActivities();
  expect(activities.length).toEqual(1);
  expect(activities[0]._id).toEqual(692349426);
  // 1 lap from shouldAddExtraLap + 1 from the segment effort
  expect(activities[0].laps).toEqual(2);
});

test('validates activities data during saveActivities', () => {
  locationIngest.processEffort(cpSegmentEffort);
  locationIngest.activities['692349426'].athlete_id = 'Invalid';
  expect(locationIngest.getActivityIds().sort()).toEqual([692349426]);

  locationIngest.saveActivities();
  expect(locationIngest.invalidActivities.length).toEqual(1);
  expect(locationIngest.invalidActivities[0].athlete_id)
    .toEqual('Invalid');
});
