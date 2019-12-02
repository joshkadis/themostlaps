const Athlete = require('../../../schema/Athlete');
const LocationIngest = require('./class.LocationIngest');
const cpSegmentEffort = require('./segmentEffort.testData');

let athleteDoc;
let locationIngest;

beforeEach(() => {
  athleteDoc = new Athlete({ _id: 541773 });
  locationIngest = new LocationIngest(athleteDoc, 1532085);
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
