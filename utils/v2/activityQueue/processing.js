const Athlete = require('../../../schema/Athlete');
const { fetchActivity } = require('../../refreshAthlete/utils');
const { ingestActivityFromQueue } = require('./ingestActivityFromQueue');

/**
 * Get Strava API data for enqueued activity
 *
 * @param {QueueActivity} queueDoc QueueActivity document
 * @param {Athlete} athleteDoc Athlete document
 * @return {Object|Bool} Strava API response for activity or false if error
 */
async function getQueueActivityData(queueDoc, athleteDoc) {
  const {
    activityId,
    status,
    numSegmentEfforts: prevNumSegmentEfforts = 0,
    ingestAttempts: prevIngestAttempts = 0,
  } = queueDoc;

  if (status !== 'pending') {
    const errorMsg = `Attempted ingest with status '${status}'`;
    console.warn(errorMsg);
    queueDoc.set({
      status: 'error',
      errorMsg,
    });
    return false;
  }

  let dataForIngest = false;
  try {
    dataForIngest = await fetchActivity(activityId, athleteDoc);
  } catch (err) {
    // i think we're ok here without doing anything
  }

  if (!dataForIngest) {
    const errorMsg = 'No fetchActivity response';
    console.warn(errorMsg);
    queueDoc.set({
      status: 'error',
      errorMsg,
    });
    return false;
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

  return dataForIngest;
}

/**
 * Ingest if needed, get result of getQueueActivityData
 *
 * @param {QueueActivity} result.processedQueueDoc
 * @param {Object} result.dataForIngest
 * @param {Athlete} result.athleteDoc
 * @param {Bool} isDryRun
 * @return {Object} Status and message to update QueueActivity document
 */
async function handleQueueActivityData({
  processedQueueDoc,
  dataForIngest,
  athleteDoc,
}, isDryRun = false) {
  // @todo shouldn't need this check, function should only accept 'shouldIngest'
  if (!dataForIngest) {
    return { status: 'error', errorMsg: 'No dataForIngest' };
  }

  // @todo same
  const isAthleteInstance = athleteDoc instanceof Athlete;
  if (!isAthleteInstance) {
    return { status: 'error', errorMsg: 'Invalid Athlete document' };
  }

  // @todo this is the only case that should be allowed here
  if (processedQueueDoc.status === 'shouldIngest') {
    return ingestActivityFromQueue(dataForIngest, athleteDoc, isDryRun);
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
