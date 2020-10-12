const {
  locationLapsFromStream,
  latlngToString,
  makeInferredSegmentEffort,
  getNearestWaypointIdx,
  setupOrderedWaypoints,
} = require('./locationLapsFromStream');
const { time, streams, activity } = require('./locationLapsFromStream.data');

const locations = {
  testLoc: {
    waypoints: [
      [40.65947, -73.97583], [40.65374, -73.97197], [40.65358, -73.96722],
    ],
  },
};

describe('locationLapsFromStream helper functions', () => {
  test('setupOrderedWaypoints', () => {
    expect(setupOrderedWaypoints(0, 5))
      .toStrictEqual({
        forCount: [1, 2, 3, 4],
        forTime: [1, 2, 3, 4, 0],
      });

    expect(setupOrderedWaypoints(2, 5))
      .toStrictEqual({
        forCount: [3, 4, 0, 1],
        forTime: [3, 4, 0, 1, 2],
      });

    expect(setupOrderedWaypoints(4, 5))
      .toStrictEqual({
        forCount: [0, 1, 2, 3],
        forTime: [0, 1, 2, 3, 4],
      });
  });

  test('latlngToString', () => {
    expect(latlngToString({ lat: 12, lon: 14 })).toEqual('12,14');
    expect(latlngToString({ latitude: 12, longitude: 14 })).toEqual('12,14');
    expect(latlngToString({ lat: 12, lng: 14 })).toEqual('12,14');
  });

  test('makeInferredSegmentEffort', () => {
    expect(makeInferredSegmentEffort(
      1, // 1
      20, // 35
      time,
      {
        start_date_local: '2013-06-20T06:22:29Z',
        start_date: '2013-06-20T10:22:29Z',
      },
    )).toStrictEqual({
      elapsed_time: 34,
      moving_time: null,
      start_date_local: '2013-06-20T06:22:30Z',
      startDateUtc: new Date('2013-06-20T10:22:30Z'),
      fromStream: true,
    });
  });

  test('getNearestWaypointIdx', () => {
    // nearest point outside of 50m default padding
    expect(getNearestWaypointIdx(
      [40.65846, -73.9739],
      locations.testLoc.waypoints,
    )).toEqual(-1);

    // increase padding
    expect(getNearestWaypointIdx(
      [40.65846, -73.9739],
      locations.testLoc.waypoints,
      300,
    )).toEqual(0);

    // closer to waypoint index > 0
    expect(getNearestWaypointIdx(
      [40.65293, -73.97184],
      locations.testLoc.waypoints,
    )).toEqual(1);
  });
});

describe('locationLapsFromStream', () => {
  test('locationLapsFromStream', () => {
    expect(locationLapsFromStream(
      streams,
      'prospectpark',
      activity,
    ).laps).toEqual(6);
  });
});
