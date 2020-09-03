const {
  locationLapsFromStream,
  latlngToString,
  makeInferredSegmentEffort,
  getNearestWaypointIdx,
} = require('./locationLapsFromStream');

const { time } = require('./locationLapsFromStream.data');

describe('locationLapsFromStream helper functions', () => {
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
    expect(getNearestWaypointIdx(
      [40.65846, -73.9739],
      [[40.65947, -73.97583], [40.65374, -73.97197], [40.65358, -73.96722]],
    )).toEqual(0);

    expect(getNearestWaypointIdx(
      [40.65293, -73.97184],
      [[40.65947, -73.97583], [40.65374, -73.97197], [40.65358, -73.96722]],
    )).toEqual(1);
  });
});
