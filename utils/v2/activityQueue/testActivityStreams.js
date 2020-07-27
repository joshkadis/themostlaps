const StreamsTest = require('../../../schema/StreamsTest');
const fetchStravaAPI = require('../../fetchStravaAPI');

/**
 * Create or update a document tracking number of segment efforts
 * and streams data points each time a queue event is fetched
 * The point of the test is to find out how long it takes for
 * streams to be available after activity creation webhook
 *
 * @param {Number} activityId
 * @param {Array} activityData.segment_efforts
 * @param {Athlete} athleteDoc
 * @returns {void}
 */
async function testActivityStreams(
  activityId,
  { segment_efforts: newSegmentEfforts = [] },
  athleteDoc,
) {
  let streamsDoc = await StreamsTest.findOne({ activityId }).exec();
  if (!streamsDoc) {
    streamsDoc = new StreamsTest({
      activityId,
      segmentEfforts: [],
      latlng: [],
      time: [],
      distance: [],
      testTime: [],
    });
  }

  const streams = await fetchStravaAPI(
    `/activities/${activityId}/streams`,
    athleteDoc,
    { keys: 'latlng,time,distance', 'key_by_type': true },
  );

  // Will be key-value pairs like { latlng: 2000 }
  const streamsLengths = streams.reduce(
    (acc, { type, data = [] }) => ({
      ...acc,
      [type]: data.length,
    }),
    {},
  );

  /**
   * Append new test data from this fetch to
   * test arrays in the test documents
   */

  const nextSegmentEfforts = [
    ...streamsDoc.segmentEfforts,
    newSegmentEfforts.length,
  ];

  // -1 indicates that streams API response missing time data
  const nextTimes = [...streamsDoc.time, streamsLengths.time || -1];

  // -1 indicates that streams API response missing latlng data
  const nextLatLngs = [...streamsDoc.latlng, streamsLengths.latlng || -1];

  // -1 indicates that streams API response missing distance data
  const nextDistances = [...streamsDoc.distance, streamsLengths.distance || -1];

  const currentTimeStr = new Date().toISOString();

  streamsDoc.set({
    segmentEfforts: nextSegmentEfforts,
    latlng: nextLatLngs,
    distance: nextDistances,
    time: nextTimes,
    testTime: [...streamsDoc.testTime, currentTimeStr],
  });
  await streamsDoc.save();
}
