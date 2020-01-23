const Athlete = require('../../../schema/Athlete');
// const Activity = require('../../../schema/Activity');
const LocationIngest = require('./class.LocationIngest');
const cpSegmentEffort = require('./segmentEffort.testData');

let athleteDoc;
let locationIngest;

beforeEach(() => {
  athleteDoc = new Athlete({ _id: 541773 });
  locationIngest = new LocationIngest(athleteDoc, 1532085);
  locationIngest.isUnitTest = true;
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
    startDateUtc: new Date('2016-08-28T10:16:15Z'),
  };
  expect(actual).toStrictEqual(expected);
});

test('formats activity from segment effort', () => {
  const actual = locationIngest.formatActivity(cpSegmentEffort);

  // Should be valid date string
  const addedDate = new Date(actual.added_date);
  expect(addedDate).toBeInstanceOf(Date);
  expect(addedDate.valueOf()).not.toBeNaN();

  delete actual.added_date; // impossible to make exact match down to the ms
  const expected = {
    _id: 692349426,
    location: 'centralpark',
    start_date_local: '2016-08-28T06:16:15Z',
    athlete_id: cpSegmentEffort.athlete.id,
    laps: 1,
    segment_efforts: [],
    source: 'signup',
    startDateUtc: new Date('2016-08-28T10:16:15Z'),
  };
  expect(actual).toStrictEqual(expected);
});

test('converts segment efforts to Activity model shapes', () => {
  // These should fail gracefully
  locationIngest.processEffort({ isSegmentEffort: 'no' });
  expect(locationIngest.getRawActivities().length).toEqual(0);

  locationIngest.processEffort({ activity: 'no' });
  expect(locationIngest.getRawActivities().length).toEqual(0);

  locationIngest.processEffort({ activity: { id: 10 } });
  expect(locationIngest.getRawActivities().length).toEqual(0);

  // Segment effort processing should succeed
  locationIngest.processEffort(cpSegmentEffort);
  expect(locationIngest.getActivityIds()).toEqual([692349426]);

  const activities = locationIngest.getRawActivities();
  expect(activities.length).toEqual(1);
  expect(activities[0]._id).toEqual(692349426);
  // 1 lap from shouldAddExtraLap + 1 from the segment effort
  expect(activities[0].laps).toEqual(2);
});

// @todo rewrite tests with new methods that separate validation and saving
// test('validates activities data during saveActivities', async () => {
//   locationIngest.processEffort(cpSegmentEffort);
//   expect(locationIngest.getActivityIds().sort()).toEqual([692349426]);
//
//   // Should be valid at first
//   let activityModel = new Activity(locationIngest.getRawActivities()[0]);
//   expect(activityModel.validateSync()).toBeUndefined();
//
//   // Then invalidate
//   locationIngest.activities['692349426'].athlete_id = 'Invalid';
//   activityModel = new Activity(locationIngest.getRawActivities()[0]);
//   expect(activityModel.validateSync()).toBeInstanceOf(Error);
//
//   await locationIngest.saveActivities();
//   // expect(locationIngest.invalidActivities.length).toEqual(1);
//   // expect(locationIngest.invalidActivities[0].athlete_id)
//   //   .toEqual('Invalid');
// });
//

// @todo Update tests for getStatsV2
// test('updates stats', () => {
//   expect(locationIngest.getStatsV1()).toEqual({ allTime: 0, single: 0 });
//
//   locationIngest.updateStatsFromSegmentEffort(
//     '2016-08-28T10:16:15Z',
//     2,
//     2,
//   );
//
//   expect(locationIngest.getStatsV1()).toEqual({
//     allTime: 2,
//     single: 2,
//     _2016: 2,
//     _2016_08: 2,
//   });
//
//   locationIngest.updateStatsFromSegmentEffort(
//     '2015-07-28T10:16:15Z',
//     1,
//     9,
//   );
//
//   expect(locationIngest.getStatsV1()).toEqual({
//     allTime: 3,
//     single: 9,
//     _2016: 2,
//     _2016_08: 2,
//     _2015: 1,
//     _2015_07: 1,
//   });
// });
