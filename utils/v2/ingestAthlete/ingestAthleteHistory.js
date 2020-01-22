/* eslint-disable quotes */
// const { uniq } = require('lodash');
const LocationIngest = require('./class.LocationIngest');
const { locations: configLocations } = require('../../../config');
const { getAthleteIdentifier } = require('../models/athlete');
const { getLocationNames } = require('../locations');
const { makeArrayAsyncIterable } = require('../asyncUtils');
const { clearAthleteHistoryV2 } = require('../models/athlete');
const { slackError, slackSuccess } = require('../../slackNotification');
const { sortUniq } = require('../utils');

// Max. allowable portion of invalid activities
const MAX_INVALID_ACTIVITIES = 0.05;

/**
 * Set stats array of all years in which
 * athlete has any stats for any location
 *
 * @param {Athlete} athleteDoc
 * @param {Object} athleteStats
 */
async function setAthleteAvailableYears(athleteDoc, athleteStats) {
  // Set array of all years in which athlete has any stats for any location
  const availableYears = sortUniq(
    Object.keys(athleteStats).reduce((acc, loc) => [
      ...acc,
      ...athleteStats[loc].availableYears,
    ], []),
  );

  athleteDoc.set({
    stats: {
      ...athleteDoc.stats,
      availableYears,
    },
  });
  athleteDoc.markModified('stats');
  await athleteDoc.save();
}

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

    if (!ingestor.getNumActivities()) {
      return false;
    }

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

    // @todo Refactor to only save the athlete at the end
    // instead of after each iteratee location
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

  // eslint-disable-next-line
  for await (const locationStats of asyncIngestAllLocations) {
    if (locationStats) {
      const locationName = Object.keys(locationStats)[0];
      athleteStats[locationName] = locationStats[locationName];
    }
  }

  if (!isDryRun) {
    await setAthleteAvailableYears(athleteDoc, athleteStats);
  }

  const summary = Object.keys(athleteStats).reduce((acc, loc) => ({
    ...acc,
    [loc]: {
      total: athleteStats[loc].allTime,
      activites: athleteStats[loc].numActivities,
    },
  }), {});

  if (!isDryRun) {
    slackSuccess(`Ingested athlete history for ${athleteDoc.id}`, summary);
  }

  console.log(`
--------RESULTS---------
Ingested athlete history for ${athleteDoc.id}:
${JSON.stringify(summary, null, 2)}
${isDryRun ? '**THIS WAS A DRY RUN**' : ''}`);
}

module.exports = ingestAthleteHistory;
