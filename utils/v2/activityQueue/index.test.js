// Mocks required prior to fetching activity data from Strava API
jest.mock('../../refreshAthlete/utils');
jest.mock('../../../schema/Athlete');
jest.mock('../../refreshAthlete/utils');

const Athlete = require('../../../schema/Athlete');
const QueueActivity = require('../../../schema/QueueActivity');
const { getQueueActivityData: __getQueueActivityData } = require('./getQueueActivityData');
const { fetchActivity } = require('../../refreshAthlete/utils');

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
      .mockImplementationOnce(async () => ({ hello: 'world' }));

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
      .mockImplementationOnce(async () => ({ segment_efforts: [] }));

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
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [] }));

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
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }));

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
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }));

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
      .mockImplementationOnce(async () => ({ segment_efforts: [] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }));

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
      .mockImplementationOnce(async () => ({ segment_efforts: [1] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }))
      .mockImplementationOnce(async () => ({ segment_efforts: [1, 4] }));

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

  test('bad status', async () => {
    const doc = new QueueActivity({
      activityId: 123,
      athleteId: 456,
      numSegmentEfforts: 2,
      ingestAttempts: 3,
      status: 'dequeued',
    });

    await getQueueActivityData(doc);
    expect(doc.status).toEqual('error');
    expect(doc.errorMsg).toEqual("Attempted ingest with status 'dequeued'");
    expect(doc.numSegmentEfforts).toEqual(2);
    expect(doc.ingestAttempts).toEqual(3);
  });

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
