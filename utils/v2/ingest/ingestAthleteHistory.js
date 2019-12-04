/* eslint-disable quotes */
// const { uniq } = require('lodash');
const LocationIngest = require('./class.LocationIngest');
const { locations: configLocations } = require('../../../config');
const { getAthleteIdentifier } = require('../models/athlete');
const { getLocationNames } = require('../locations');

let scopedAthleteDoc = false;

async function asyncIngestSingleLocation(locationName) {
  if (!configLocations[locationName]) {
    console.log(locationName);
    return false;
  }

  const {
    canonicalSegmentId,
  } = configLocations[locationName];

  try {
    const ingestor = new LocationIngest(scopedAthleteDoc, canonicalSegmentId);
    console.log(`${"\n"}LocationIngest created for segment ${ingestor.segmentId} (${locationName})`);
    await ingestor.fetchActivities();
    // await ingestor.saveActivities();

    return {
      [locationName]: ingestor.getStats(),
    };
  } catch (err) {
    console.warn(`${"\n"}Error ingesting ${locationName} | ${canonicalSegmentId}`);
    console.log(err);
    // eslint-disable-next-line quotes
  }
  return false;
}

const asyncIngestAllLocations = getLocationNames();
asyncIngestAllLocations[Symbol.asyncIterator] = () => ({
  // eslint-disable-next-line func-names
  async next() {
    if (asyncIngestAllLocations.length) {
      // Keep going until all locations have been ingested
      const parkResult = await asyncIngestSingleLocation(
        asyncIngestAllLocations.pop(),
      );
      return Promise.resolve({ value: parkResult, done: false });
    }
    return Promise.resolve({ done: true });
  },
});

/**
 * Handle historical activities for new athlete
 *
 * @param Athlete athleteDoc
 */
async function ingestAthleteHistory(athleteDoc) {
  scopedAthleteDoc = athleteDoc;
  // Make sure scopedAthleteDoc is set up correctly
  console.log(`Ingesting ${getAthleteIdentifier(scopedAthleteDoc)} from scopedAthleteDoc$`);

  // @todo revert back to existing athlete stats propery
  const athleteStats = {};
  let athleteLocations = [];

  // eslint-disable-next-line
  for await (const locationStats of asyncIngestAllLocations) {
    if (!locationStats) {
      console.warn(`asyncIngestSingleLocation returned ${JSON.stringify(locationStats)}`);
    } else {
      const locationName = Object.keys(locationStats)[0];
      Object.assign(athleteStats, locationStats);
      athleteLocations = [...athleteLocations, locationName];
    }
  }

  console.log(`${"\n"}--------RESULTS---------`);
  console.log(athleteStats);
  console.log(athleteLocations);
  // await updateAthleteDoc(athleteDoc, athleteStats, athleteLocations);
}

// async function updateAthleteDoc(athleteDoc, athleteStats, athleteLocations) {
//   // Set stats and locations to athlete document
//   athleteDoc.set('stats', athleteStats);
//   athleteLocations = uniq(athleteLocations);
//   athleteDoc.set('locations', athleteLocations);
//   const athleteIdentifier = getAthleteIdentifier(athleteDoc);
//   try {
//     await athleteDoc.save();
//     console.log(`Processed stats and locations for ${athleteIdentifier}`);
//     console.log(athleteStats);
//     console.log(athleteLocations);
//   } catch (err) {
//     // @todo Handle error
//     console.warn(`Error saving ${athleteIdentifier}`);
//     console.log(err);
//   }
// }

module.exports = ingestAthleteHistory;
