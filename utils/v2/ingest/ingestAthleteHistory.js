const { uniq } = require('lodash');
const LocationIngest = require('./class.LocationIngest');
const { locations: configLocations } = require('../../../config');
const { getAthleteIdentifier } = require('../models/athlete');

let scopedAthleteDoc = false;

async function* asyncIngestLocation(location) {
  if (!scopedAthleteDoc) {
    yield false;
  }

  const {
    locationName,
    canonicalSegmentId,
  } = location;

  try {
    const ingestor = new LocationIngest(scopedAthleteDoc, canonicalSegmentId);
    await ingestor.getActivities();
    await ingestor.saveActivities();

    yield {
      [locationName]: ingestor.getStats(),
    };
  } catch (err) {
    console.warn(`Error ingesting ${locationName} | ${canonicalSegmentId}`);
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
  let athleteStats = athleteDoc.get('stats');
  let athleteLocations = athleteDoc.get('locations');

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
  athleteLocations = uniq(athleteLocations);
  athleteDoc.set('locations', athleteLocations);
  const athleteIdentifier = getAthleteIdentifier(athleteDoc);
  try {
    await athleteDoc.save();
    console.log(`Ingested activities for ${athleteIdentifier}`);
    console.log(athleteStats);
    console.log(athleteLocations);
  } catch (err) {
    // @todo Handle error
    console.warn(`Error saving ${athleteIdentifier}`);
    console.log(err);
  }
}

module.exports = ingestAthleteHistory;
