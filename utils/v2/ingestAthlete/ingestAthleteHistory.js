/* eslint-disable quotes */
// const { uniq } = require('lodash');
const LocationIngest = require('./class.LocationIngest');
const { locations: configLocations } = require('../../../config');
const { getAthleteIdentifier } = require('../models/athlete');
const { getLocationNames } = require('../locations');
const { makeArrayAsyncIterable } = require('../asyncUtils');
const { clearAthleteHistoryV2 } = require('../models/athlete');
const { slackError, slackSuccess } = require('../../slackNotification');

// Max. allowable portion of invalid activities
const MAX_INVALID_ACTIVITIES = 0.05;

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
    ingestor.prepareActivities();
    const numInvalid = ingestor.invalidActivities.length;

    if (numInvalid) {
      console.log(JSON.stringify(ingestor.invalidActivities[0], null, 2));
    } else {
      console.log('All activites were validated successfully');
    }

    if (numInvalid / ingestor.getNumActivities > MAX_INVALID_ACTIVITIES) {
      if (isDryRun) {
        throw new Error(`Athlete ${athleteDoc.id} exceeded max invalid activities`);
      }
      slackError(132, ingestor.invalidActivities);
      return {};
    }

    if (!isDryRun) {
      await ingestor.saveActivities();
    }

    if (!isDryRun) {
      await ingestor.saveStatsV2();
    }

    return {
      [locationName]: ingestor.getStatsV2(),
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
  console.log(`Ingesting ${getAthleteIdentifier(athleteDoc)} from athleteDoc`);

  // Will check all known locations
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

  if (!isDryRun) {
    const summary = Object.keys(athleteStats).reduce((acc, key) => ({
      ...acc,
      [key]: athleteStats[key].allTime,
    }), {});

    slackSuccess(`Ingested athlete history for ${athleteDoc.id}`, summary);
  }

  // console.log(`${"\n"}--------RESULTS---------`);
  // console.log(athleteStats);
  // console.log(athleteLocations);
}

module.exports = ingestAthleteHistory;
