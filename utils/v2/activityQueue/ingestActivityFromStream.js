const fetchStravaAPI = require("../../fetchStravaAPI");

/**
 * Calculate laps from activity data stream instead of segment efforts
 * Then ingest Activity
 * Used for non-subscriber athletes who don't have segment data
 *
 * @param {QueueActivity} queueDoc
 * @param {Athlete} athleteDoc
 * @returns {void}
 */
async function ingestActivityFromStream(queueDoc, athleteDoc) {
  queueDoc.set({
    calculatingFromStream: true,
  });

  // This basically just so we can run activityCouldHaveLaps()
  const activityDetail = await fetchDetailedActivityFromQueue(
    queueDoc,
    athleteDoc,
  );
  if (!activityDetail) {
    return;
  }

  const streams = await fetchStravaAPI(
    `/activities/${queueDoc.activityId}/streams`,
    athleteDoc,
    { keys: 'latlng,time,distance', 'key_by_type': true },
  );

  // get number of laps and inferred segment_efforts

  // if no laps, dequeue activity and exit

  // if has laps, create Activity document

  // mark QueueActivity as ingested

}

module.exports = ingestActivityFromStream;
