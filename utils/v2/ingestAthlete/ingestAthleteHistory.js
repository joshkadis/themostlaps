/* eslint-disable quotes */
// const { uniq } = require('lodash');
const Athlete = require('../../../schema/Athlete');
const LocationIngest = require('./class.LocationIngest');
const { locations: configLocations } = require('../../../config');
const { getAthleteIdentifier } = require('../models/athlete');
const { getLocationNames } = require('../locations');
const { makeArrayAsyncIterable } = require('../asyncUtils');
const { clearAthleteHistoryV2 } = require('../models/athlete');

/**
 * Create LocationIngest object for a given location
 * Save activities and stats depending on value of isDryRun
 *
 * @param {String} locationName
 * @param {Athlete} athleteDoc
 * @param {Boolean} opts.isDryRun
 * @returns {Object} Stats object for location
 */
async function asyncIngestSingleLocation(
  locationName,
  athleteDoc,
  { isDryRun = false },
) {
  if (!(athleteDoc instanceof Athlete)) {
    // @todo Report error
    console.log(`athleteDoc was not an instance of Athlete`);
    return false;
  }

  // Make sure athleteDoc is set up correctly
  console.log(`Ingesting ${getAthleteIdentifier(athleteDoc)} from athleteDoc`);

  if (!configLocations[locationName]) {
    // @todo Report error
    console.log(`Couldn't find location: ${JSON.stringify(locationName)}`);
    return false;
  }

  const {
    canonicalSegmentId,
  } = configLocations[locationName];

  try {
    const ingestor = new LocationIngest(athleteDoc, canonicalSegmentId);
    console.log(`${"\n"}LocationIngest created for segment ${ingestor.segmentId} (${locationName})`);

    await ingestor.fetchActivities();
    console.log(`Found ${ingestor.getNumActivities()} activities`);
    if (!isDryRun) {
      await ingestor.saveActivities();
    }

    const locationStats = ingestor.getStatsV2();
    if (!isDryRun) {
      athleteDoc.update({ stats_version: 'v2' });
      await athleteDoc.save();
      await ingestor.saveStats();
    }

    return {
      [locationName]: locationStats,
    };
  } catch (err) {
    console.warn(`${"\n"}Error ingesting ${locationName} | ${canonicalSegmentId}`);
    console.log(err);
    // eslint-disable-next-line quotes
  }
  return false;
}

/**
 * Handle historical activities for new athlete
 *
 * @param Athlete athleteDoc
 * @param Boolean isDryRun
 */
async function ingestAthleteHistory(athleteDoc, isDryRun) {
  const asyncIngestAllLocations = makeArrayAsyncIterable(
    getLocationNames(),
    (loc) => asyncIngestSingleLocation(loc, athleteDoc, { isDryRun }),
  );

  if (!isDryRun) {
    await clearAthleteHistoryV2(athleteDoc);
  }

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
}

module.exports = ingestAthleteHistory;
