const { uniq, cloneDeep } = require('lodash');
const LocationIngest = require('./class.LocationIngest');
const { locations: configLocations } = require('../../../config');
const { getAthleteIdentifier } = require('../models/athlete');

let scopedAthleteDoc = false;
let idx = 0;

async function* asyncIngestSingleLocation(allLocations) {
  console.log(this);
  yield "hello";
  yield "there";
  const {
    locationName,
    canonicalSegmentId,
  } = configLocations[locationToIngest];

  try {
    const ingestor = new LocationIngest(scopedAthleteDoc, canonicalSegmentId);
    console.log(`LocationIngest created for segment ${ingestor.segmentId}`);
    await ingestor.getActivities();
    // await ingestor.saveActivities();

    yield {
      [locationName]: { yep: locationName },
    };
  } catch (err) {
    console.warn(`Error ingesting ${locationName} | ${canonicalSegmentId}`);
    console.log(err);
    // eslint-disable-next-line quotes
    console.log("----------------------\n\n");
  } finally {
    console.log('DONE!');
  }
}

const asyncIngestAllLocations = cloneDeep(configLocations);
asyncIngestAllLocations[Symbol.iterator] = asyncIngestSingleLocation;

/**
 * Handle historical activities for new athlete
 *
 * @param Athlete athleteDoc
 */
async function ingestAthleteHistory(athleteDoc) {
  scopedAthleteDoc = athleteDoc;
  // Make sure scopedAthleteDoc is set up correctly
  console.log(`Ingesting ${getAthleteIdentifier(scopedAthleteDoc)} from scopedAthleteDoc`);

  // @todo revert back to existing athlete stats propery
  let athleteStats = {};
  let athleteLocations = [];

  // eslint-disable-next-line
  for await (const locationStats of asyncIngestAllLocations) {
    console.log('locationStats ' + locationStats);
    if (!locationStats) {
      console.log(`asyncIngestSingleLocation returned ${JSON.stringify(locationStats)}`);
      return;
    }
    // receives something like { prospectpark: { allTime: 0, etc. } }
    const locationName = Object.keys(locationStats)[0];
    console.log(`asyncIngestSingleLocation for ${locationName} returned ${JSON.stringify(locationStats)}`);
    athleteStats = {
      ...athleteStats,
      locations: {
        [locationName]: locationStats[locationName],
      },
    };
    athleteLocations = [...athleteLocations, locationName];
  }

  // Set stats and locations to athlete document
  athleteDoc.set('stats', athleteStats);
  athleteLocations = uniq(athleteLocations);
  athleteDoc.set('locations', athleteLocations);
  const athleteIdentifier = getAthleteIdentifier(athleteDoc);
  try {
    await athleteDoc.save();
    console.log(`Processed stats and locations for ${athleteIdentifier}`);
    console.log(athleteStats);
    console.log(athleteLocations);
  } catch (err) {
    // @todo Handle error
    console.warn(`Error saving ${athleteIdentifier}`);
    console.log(err);
  }
}

module.exports = ingestAthleteHistory;
