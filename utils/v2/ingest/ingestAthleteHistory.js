const LocationIngest = require('./class.LocationIngest');
const { locations: configLocations } = require('../../../config');

let scopedAthleteDoc = false;

async function* asyncIngestLocation(location) {
  if (!scopedAthleteDoc) {
    yield false;
  }

  try {
    const {
      locationName,
      canonicalSegmentId,
    } = location;

    const ingestor = new LocationIngest(canonicalSegmentId);
    await ingestor.getActivities();
    await ingestor.saveActivities();

    yield {
      [locationName]: ingestor.getStats(),
    };
  } catch (err) {
    console.warn(`Error ingesting ${location.locationName} | ${location.canonicalSegmentId}`);
    console.log(err);
    // eslint-disable-next-line quotes
    console.log("----------------------\n\n");
  }
}

/**
 * Handle historical activities for new athlete
 *
 * @param Athlete athleteDoc
 */
async function ingestAthleteHistory(athleteDoc) {
  scopedAthleteDoc = athleteDoc;
  let athleteStats = {};
  let athleteLocations = [];

  // eslint-disable-next-line
  for await (const locationStats of asyncIngestLocation(configLocations)) {
    if (!locationStats) {
      return;
    }
    // receives something like { prospectpark: { allTime: 0, etc. } }
    athleteStats = {
      ...athleteStats,
      locationStats,
    };
    athleteLocations = [...athleteLocations, Object.keys(locationStats)[0]];
  }

  // Set stats and locations to athlete document
  athleteDoc.set('stats', athleteStats);
  athleteDoc.set('locations', athleteLocations);
  try {
    await athleteDoc.save();
  } catch (err) {
    // @todo Handle error
  }
}

module.exports = ingestAthleteHistory;
