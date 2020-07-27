const {
  fetchActivity,
  activityCouldHaveLaps,
} = require('../../refreshAthlete/utils');

const SHOULD_TEST_STREAMS = true;

/**
 * Get Strava API data for enqueued activity
 * Assume queue status check was already performed
 *
 * @param {QueueActivity} queueDoc QueueActivity document
 * @param {Athlete} athleteDoc Athlete document
 * @return {Object|Bool} Strava API response for activity or false if error
 */
async function getQueueActivityData(queueDoc, athleteDoc) {
  const {
    activityId,
    numSegmentEfforts: prevNumSegmentEfforts = 0,
    ingestAttempts: prevIngestAttempts = 0,
    status: queuedStatus,
  } = queueDoc;

  let dataForIngest = false;
  try {
    dataForIngest = await fetchActivity(activityId, athleteDoc);
  } catch (err) {
    // i think we're ok here without doing anything
  }

  if (SHOULD_TEST_STREAMS && dataForIngest) {
    testActivityStreams(activityId, dataForIngest, athleteDoc);
  }

  // There are some edge cases where fetchActivity could return an empty object
  // so check for activity id
  if (!dataForIngest || !dataForIngest.id) {
    const errorMsg = 'No fetchActivity response';
    console.warn(errorMsg);
    queueDoc.set({
      status: 'error',
      errorMsg,
    });
    return false;
  }

  if (!activityCouldHaveLaps(dataForIngest)) {
    queueDoc.set({
      status: 'dequeued',
      detail: 'activityCouldHaveLaps() returned false during queue check',
    });
  }

  const nextNumSegmentEfforts = dataForIngest.segment_efforts
    ? dataForIngest.segment_efforts.length
    : 0;

  // Look for same number of segment efforts twice in a row
  // Use this as proxy for Strava processing having completed
  if (
    queueDoc.status !== 'dequeued'
    && nextNumSegmentEfforts > 0
    && nextNumSegmentEfforts === prevNumSegmentEfforts
  ) {
    queueDoc.set({ status: 'shouldIngest' });
  } else if (queuedStatus === 'maxed') {
    if (nextNumSegmentEfforts > 0) {
      queueDoc.set({ status: 'shouldIngest' });
    } else {
      const finalMsg = `${activityId} | Final attempt had no segment efforts`;
      console.log(finalMsg);
      queueDoc.set({
        status: 'dequeued',
        detail: finalMsg,
      });
    }
  }

  queueDoc.set({
    numSegmentEfforts: nextNumSegmentEfforts,
    lastAttemptedAt: Date.now(),
    ingestAttempts: prevIngestAttempts + 1,
  });

  return dataForIngest;
}

module.exports = {
  getQueueActivityData,
};
