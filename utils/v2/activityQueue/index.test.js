// Mocks required prior to fetching activity data from Strava API
jest.mock('../../refreshAthlete/utils');
jest.mock('../../../schema/Athlete');

const Athlete = require('../../../schema/Athlete');
const QueueActivity = require('../../../schema/QueueActivity');
const { getQueueActivityData: __getQueueActivityData } = require('./getQueueActivityData');
const {
  fetchActivity,
  activityCouldHaveLaps,
} = require('../../refreshAthlete/utils');
const { minDistance } = require('../../../config');

// Always call with isDryRun = true
const getQueueActivityData = async (queueDoc) => {
  const processed = await __getQueueActivityData(
    queueDoc,
    true,
  );
  return processed.processedQueueDoc;
};

// Mocks
Athlete.findById.mockImplementation(async () => 'true');
// mock this as basic checks since fetchActivity is
// what we care about from the refreshAthlete/utils module
activityCouldHaveLaps.mockImplementation((data) => data.id
  && data.type === 'ride'
  && !data.trainer
  && !data.manual
  && data.start_latlng.length === 2
  && data.end_latlng.length === 2
  && data.distance >= minDistance);

// Basic info to pass activityCouldHaveLaps()
const BASE_COULD_HAVE_LAPS = {
  id: 123,
  type: 'ride',
  trainer: false,
  manual: false,
  start_latlng: [40.661990, -73.969681], // Just use park center
  end_latlng: [40.661990, -73.969681],
  distance: 10000,
};

describe('getQueueActivityData()', () => {
  test('mocking is working', async () => {
    // Athlete model mock
    expect(await Athlete.findById(123)).toEqual('true');

    // fetchActivity() mock
    fetchActivity
      .mockImplementationOnce(async () => ({ hello: 'world' }))
      .mockImplementationOnce(async () => ({ hello: 'again' }));

    expect(await fetchActivity()).toEqual({ hello: 'world' });
    expect(await fetchActivity()).toEqual({ hello: 'again' });
  });

  test('no segment efforts on first attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        hello: 'world',
      }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
    });
    // first with segment_efforts not set
    await getQueueActivityData(doc);
    expect(doc.errorMsg).not.toEqual('No athleteDoc');
    expect(doc.errorMsg).not.toEqual('No fetchActivity response');
    expect(doc.numSegmentEfforts).toEqual(0);
    expect(doc.ingestAttempts).toEqual(1);
    expect(doc.status).toEqual('pending');
  });

  test('empty efforts on first attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [],
      }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
    });
    // now with segment_efforts as empty array
    await getQueueActivityData(doc);

    expect(doc.errorMsg).not.toEqual('No athleteDoc');
    expect(doc.errorMsg).not.toEqual('No fetchActivity response');
    expect(doc.numSegmentEfforts).toEqual(0);
    expect(doc.ingestAttempts).toEqual(1);
    expect(doc.status).toEqual('pending');
  });

  test('no segment efforts on second attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [],
      }))
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [],
      }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    await getQueueActivityData(doc);
    await getQueueActivityData(doc);

    expect(doc.status).toEqual('pending');
    expect(doc.numSegmentEfforts).toEqual(0);
    expect(doc.ingestAttempts).toEqual(2);
  });

  test('has segment efforts on second attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [],
      }))
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [1, 4],
      }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    await getQueueActivityData(doc);
    await getQueueActivityData(doc);

    expect(doc.status).toEqual('pending');
    expect(doc.numSegmentEfforts).toEqual(2);
    expect(doc.ingestAttempts).toEqual(2);
  });

  test('has segment efforts on third attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [],
      }))
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [],
      }))
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [1, 4],
      }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    await getQueueActivityData(doc);
    await getQueueActivityData(doc);
    await getQueueActivityData(doc);

    expect(doc.status).toEqual('pending');
    expect(doc.numSegmentEfforts).toEqual(2);
    expect(doc.ingestAttempts).toEqual(3);
  });

  test('received partial segment efforts', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [],
      }))
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [1],
      }))
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [1, 4],
      }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    await getQueueActivityData(doc);
    expect(doc.status).toEqual('pending');
    expect(doc.numSegmentEfforts).toEqual(0);
    expect(doc.ingestAttempts).toEqual(1);

    await getQueueActivityData(doc);

    expect(doc.status).toEqual('pending');
    expect(doc.numSegmentEfforts).toEqual(1);
    expect(doc.ingestAttempts).toEqual(2);

    await getQueueActivityData(doc);

    expect(doc.status).toEqual('pending');
    expect(doc.numSegmentEfforts).toEqual(2);
    expect(doc.ingestAttempts).toEqual(3);
  });

  test('received partial then complete segment efforts', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [1],
      }))
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [1, 4],
      }))
      .mockImplementationOnce(async () => ({
        ...BASE_COULD_HAVE_LAPS,
        segment_efforts: [1, 4],
      }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    await getQueueActivityData(doc);
    expect(doc.status).toEqual('pending');
    expect(doc.numSegmentEfforts).toEqual(1);
    expect(doc.ingestAttempts).toEqual(1);

    await getQueueActivityData(doc);

    expect(doc.status).toEqual('pending');
    expect(doc.numSegmentEfforts).toEqual(2);
    expect(doc.ingestAttempts).toEqual(2);

    await getQueueActivityData(doc);

    expect(doc.status).toEqual('shouldIngest');
    expect(doc.numSegmentEfforts).toEqual(2);
    expect(doc.ingestAttempts).toEqual(3);
  });

  // @note Removed "bad status" check because
  // getQueueActivityData() was changed to allow any status.
  // The check is now performed earlier in processQueueActivity()

  test('missing response for fetchActivity', async () => {
    fetchActivity
      .mockImplementationOnce(async () => false);

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
    });
    await getQueueActivityData(doc);
    expect(doc.status).toEqual('error');
    expect(doc.errorMsg).toEqual('No fetchActivity response');
    expect(doc.numSegmentEfforts).toEqual(0);
    expect(doc.ingestAttempts).toEqual(0);
  });
});
