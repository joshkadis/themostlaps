const Athlete = require('../../../schema/Athlete');
const Activity = require('../../../schema/Activity');
const LocationIngest = require('./class.LocationIngest');
const cpSegmentEffort = require('./segmentEffort.testData');


let athleteDoc;
let locationIngest;
const getActivityIds = () => Object.keys(locationIngest.activities)
  .map((id) => Number(id));

describe('Tests for LocationIngest class', () => {
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
    expect(getActivityIds()).toEqual([692349426]);

    const activities = locationIngest.getRawActivities();
    expect(activities.length).toEqual(1);
    expect(activities[0]._id).toEqual(692349426);
    // 1 lap from shouldAddExtraLap + 1 from the segment effort
    expect(activities[0].laps).toEqual(2);
  });

  test('updates activityLocations array from one or more Activity docs', () => {
    // Create some activity documents
    const firstPP = new Activity({
      _id: 123,
      athlete_id: 541773,
      laps: 4,
      segment_efforts: [],
      location: 'prospectpark',
    });

    // Same activity with laps in second location
    const firstCP = new Activity({
      _id: 123,
      athlete_id: 541773,
      laps: 3,
      segment_efforts: [],
      location: 'centralpark',
    });

    // Same activity with updated laps in first location
    const secondPP = new Activity({
      _id: 123,
      athlete_id: 541773,
      laps: 8,
      segment_efforts: [],
      location: 'prospectpark',
    });

    // Other activity with laps in first location
    const otherPP = new Activity({
      _id: 456,
      athlete_id: 541773,
      laps: 99,
      segment_efforts: [],
      location: 'prospectpark',
    });

    // Should make activityLocations for single location
    locationIngest.updateActivityLocations(firstPP);
    expect(firstPP.validateSync()).toBeUndefined();
    expect(firstPP.toJSON().activityLocations)
      .toStrictEqual([{
        laps: 4,
        location: 'prospectpark',
        segment_efforts: [],
      }]);

    // Should add second location and update number of laps for the first
    locationIngest.updateActivityLocations(firstPP, firstCP, secondPP);
    expect(firstPP.validateSync()).toBeUndefined();
    expect(firstPP.toJSON().activityLocations)
      .toStrictEqual([
        {
          laps: 8,
          location: 'prospectpark',
          segment_efforts: [],
        },
        {
          laps: 3,
          location: 'centralpark',
          segment_efforts: [],
        },
      ]);

    // Should not be able to update from another activity w same location
    locationIngest.updateActivityLocations(firstPP, otherPP);
    expect(firstPP.validateSync()).toBeUndefined();
    expect(firstPP.toJSON().activityLocations)
      .toStrictEqual([
        {
          laps: 8,
          location: 'prospectpark',
          segment_efforts: [],
        },
        {
          laps: 3,
          location: 'centralpark',
          segment_efforts: [],
        },
      ]);
  });
});

// @todo rewrite tests with new methods that separate validation and saving
// test('validates activities data during saveActivities', async () => {
//   locationIngest.processEffort(cpSegmentEffort);
//   expect(getActivityIds().sort()).toEqual([692349426]);
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
