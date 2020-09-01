const Athlete = require('../../../schema/Athlete');
const fetchStravaAPI = require('../../fetchStravaAPI');
const { captureSentry } = require('../services/sentry');
const { findPotentialLocations } = require('./findPotentialLocations');
const { locationLapsFromStream } = require('./locationLapsFromStream');

/**
 * Calculate laps from activity data stream instead of segment efforts
 * Used for non-subscriber athletes who don't have segment data
 *
 * @param {Object} activityData JSON object for activity from Strava API
 * @returns {Object} Stats object for Activity document
 */
async function activityStatsFromStream(activityData) {
  const athleteDoc = await Athlete.findById(activityData.athlete.id);
  if (!athleteDoc) {
    captureSentry(
      'Attempted activityStatsFromStream for unknown athlete',
      'transformActivity',
      {
        athleteId: activityData.athlete.id,
        activityId: activityData.id,
      },
    );
    return {};
  }

  const streams = await fetchStravaAPI(
    `/activities/${activityData.id}/streams`,
    athleteDoc,
    { keys: 'latlng,time,distance', key_by_type: true },
  );

  // add coordinates formatted for geolib
  streams.geoCoords = streams.latlng.map(([lat, lon]) => ({ lat, lon }));

  // Get number of laps and inferred segment_efforts for each location
  const potentialLocs = findPotentialLocations(activityData);
  const activityLocations = potentialLocs.map(
    (loc) => locationLapsFromStream(streams, loc),
  );
  const topLocation = activityLocations.reduce(
    (acc, locStats) => {
      if (!acc.laps || acc.laps < locStats.laps) {
        return {
          ...locStats,
        };
      }
      return acc;
    },
    {},
  );
  return {
    ...topLocation,
    activityLocations,
  };
}

module.exports = activityStatsFromStream;
