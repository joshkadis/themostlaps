const Athlete = require('../../../schema/Athlete');
const { fetchActivity } = require('../../refreshAthlete/utils');
const { ingestActivityFromQueue } = require('./ingestActivityFromQueue');

/**
 * Process an activity in the queue and return updated document
 *
 * @param {QueueActivity} queueDoc QueueActivity document
 * @return {QueueActivity} queueDoc with updated properties
 */
async function getQueueActivityData(queueDoc) {
  const {
    activityId,
    athleteId,
    status,
    numSegmentEfforts: prevNumSegmentEfforts = 0,
    ingestAttempts: prevIngestAttempts = 0,
  } = queueDoc;

  if (status !== 'pending') {
    console.warn(`Attempted to ingest queue activity ${activityId} with status ${status}`);
    queueDoc.set({
      status: 'error',
      errorMsg: `Attempted ingest with status '${status}'`,
    });
    return {
      processedQueueDoc: queueDoc,
      dataForIngest: false,
      athleteDoc: false,
    };
  }

  const athleteDoc = await Athlete.findById(athleteId);
  if (!athleteDoc) {
    console.warn(`Could not find athlete ${athleteId} to ingest queue activity ${activityId}`);
    queueDoc.set({
      status: 'error',
      errorMsg: 'No athleteDoc',
    });
    return {
      processedQueueDoc: queueDoc,
      dataForIngest: false,
      athleteDoc: false,
    };
  }

  let dataForIngest = false;
  try {
    dataForIngest = await fetchActivity(activityId, athleteDoc);
  } catch (err) {
    // i think we're ok here without doing anything
  }

  if (!dataForIngest) {
    console.warn(`No fetchActivity response for activity ${activityId}`);
    queueDoc.set({
      status: 'error',
      errorMsg: 'No fetchActivity response',
    });
    return {
      processedQueueDoc: queueDoc,
      dataForIngest: false,
      athleteDoc: false,
    };
  }

  const nextNumSegmentEfforts = dataForIngest.segment_efforts
    ? dataForIngest.segment_efforts.length
    : 0;

  // Look for same number of segment efforts twice in a row
  // Use this as proxy for Strava processing having completed
  if (
    nextNumSegmentEfforts > 0
    && nextNumSegmentEfforts === prevNumSegmentEfforts
  ) {
    queueDoc.set({ status: 'shouldIngest' });
  }

  queueDoc.set({
    numSegmentEfforts: nextNumSegmentEfforts,
    lastAttemptedAt: Date.now(),
    ingestAttempts: prevIngestAttempts + 1,
  });
  return {
    processedQueueDoc: queueDoc,
    dataForIngest,
    athleteDoc,
  };
}

/**
 * Ingest if needed, get result of getQueueActivityData
 *
 * @param {QueueActivity} result.processedQueueDoc
 * @param {Object} result.dataForIngest
 * @param {Athlete} result.athleteDoc
 * @return {Object} Status and message to update QueueActivity document
 */
async function handleQueueActivityData({
  processedQueueDoc,
  dataForIngest,
  athleteDoc,
}) {
  if (!dataForIngest) {
    return { status: 'error', errorMsg: 'No dataForIngest' };
  }

  const isAthleteInstance = athleteDoc instanceof Athlete;
  if (!isAthleteInstance) {
    return { status: 'error', errorMsg: 'Invalid Athlete document' };
  }

  if (processedQueueDoc.status === 'shouldIngest') {
    return ingestActivityFromQueue(dataForIngest, athleteDoc);
  }

  if (processedQueueDoc.status === 'pending') {
    return { errorMsg: '' };
  }

  return {
    status: 'dequeued',
    detail: 'Invalid data passed to handleQueueActivityData()',
  };
}

module.exports = {
  getQueueActivityData,
  handleQueueActivityData,
};
