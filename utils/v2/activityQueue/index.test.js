// Mocks required prior to fetching activity data from Strava API
jest.mock('../../refreshAthlete/utils');
jest.mock('../../../schema/Athlete');
jest.mock('../../refreshAthlete/utils');

const Athlete = require('../../../schema/Athlete');
const QueueActivity = require('../../../schema/QueueActivity');
const { processQueueActivity: __processQueueActivity } = require('./');
const { fetchActivity } = require('../../refreshAthlete/utils');

// Always call with isDryRun = true
const processQueueActivity = async (queueDoc) => {
  const processed = await __processQueueActivity(
    queueDoc,
    true,
  );
  return processed.processedQueueDoc;
};

// Mocks
Athlete.findById.mockImplementation(async () => 'true');

describe('processQueueActivity()', () => {
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
      .mockImplementationOnce(async () => ({ hello: 'world' }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
    });
    // first with segment_efforts not set
    const actual = await processQueueActivity(doc);

    expect(actual.errorMsg).not.toEqual('No athleteDoc');
    expect(actual.errorMsg).not.toEqual('No fetchActivity response');
    expect(actual.numSegmentEfforts).toEqual(0);
    expect(actual.ingestAttempts).toEqual(1);
    expect(actual.status).toEqual('pending');
  });

  test('empty efforts on first attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({ segment_efforts: [] }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
    });
    // now with segment_efforts as empty array
    const second = await processQueueActivity(doc);

    expect(second.errorMsg).not.toEqual('No athleteDoc');
    expect(second.errorMsg).not.toEqual('No fetchActivity response');
    expect(second.numSegmentEfforts).toEqual(0);
    expect(second.ingestAttempts).toEqual(1);
    expect(second.status).toEqual('pending');
  });

  test('no segment efforts on second attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [] }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    const initial = await processQueueActivity(doc);
    const actual = await processQueueActivity(initial);

    expect(actual.status).toEqual('pending');
    expect(actual.numSegmentEfforts).toEqual(0);
    expect(actual.ingestAttempts).toEqual(2);
  });

  test('has segment efforts on second attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    const initial = await processQueueActivity(doc);
    const actual = await processQueueActivity(initial);

    expect(actual.status).toEqual('pending');
    expect(actual.numSegmentEfforts).toEqual(2);
    expect(actual.ingestAttempts).toEqual(2);
  });

  test('has segment efforts on third attempt', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    const initial = await processQueueActivity(doc);
    const second = await processQueueActivity(initial);
    const actual = await processQueueActivity(second);

    expect(actual.status).toEqual('pending');
    expect(actual.numSegmentEfforts).toEqual(2);
    expect(actual.ingestAttempts).toEqual(3);
  });

  test('received partial segment efforts', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    const initial = await processQueueActivity(doc);
    expect(initial.status).toEqual('pending');
    expect(initial.numSegmentEfforts).toEqual(0);
    expect(initial.ingestAttempts).toEqual(1);

    const second = await processQueueActivity(initial);

    expect(second.status).toEqual('pending');
    expect(second.numSegmentEfforts).toEqual(1);
    expect(second.ingestAttempts).toEqual(2);

    const final = await processQueueActivity(second);

    expect(final.status).toEqual('pending');
    expect(final.numSegmentEfforts).toEqual(2);
    expect(final.ingestAttempts).toEqual(3);
  });

  test('received partial then complete segment efforts', async () => {
    fetchActivity
      .mockImplementationOnce(async () => ({ segment_efforts: [1] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }));

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 0,
      ingestAttempts: 0,
    });
    const initial = await processQueueActivity(doc);
    expect(initial.status).toEqual('pending');
    expect(initial.numSegmentEfforts).toEqual(1);
    expect(initial.ingestAttempts).toEqual(1);

    const second = await processQueueActivity(initial);

    expect(second.status).toEqual('pending');
    expect(second.numSegmentEfforts).toEqual(2);
    expect(second.ingestAttempts).toEqual(2);

    const final = await processQueueActivity(second);

    expect(final.status).toEqual('shouldIngest');
    expect(final.numSegmentEfforts).toEqual(2);
    expect(final.ingestAttempts).toEqual(3);
  });

  test('bad status', async () => {
    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 2,
      ingestAttempts: 3,
      status: 'dequeued',
    });

    const actual = await processQueueActivity(doc);
    expect(actual.status).toEqual('dequeued');
    expect(actual.numSegmentEfforts).toEqual(2);
    expect(actual.ingestAttempts).toEqual(3);
  });

  test('missing response for fetchActivity', async () => {
    fetchActivity
      .mockImplementationOnce(async () => false);

    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
    });
    const actual = await processQueueActivity(doc);
    expect(actual.status).toEqual('error');
    expect(actual.errorMsg).toEqual('No fetchActivity response');
    expect(actual.numSegmentEfforts).toEqual(0);
    expect(actual.ingestAttempts).toEqual(0);
  });
});
