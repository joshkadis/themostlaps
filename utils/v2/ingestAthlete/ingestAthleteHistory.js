/* eslint-disable quotes */
// const { uniq } = require('lodash');
const LocationIngest = require('./class.LocationIngest');
const { locations: configLocations } = require('../../../config');
const { getAthleteIdentifier } = require('../models/athleteHelpers');
const { getLocationNames } = require('../locations');
const { makeArrayAsyncIterable } = require('../asyncUtils');
const { clearAthleteHistoryV2 } = require('../models/athleteHelpers');
const { slackSuccess } = require('../../slackNotification');
const { sortUniq } = require('../utils');
const { captureSentry } = require('../services/sentry');

// Max. allowable portion of invalid activities
const MAX_INVALID_ACTIVITIES = 0.05;

/**
 * Get ordered array of years in which athlete has stats anywhere
 *
 * @param {Object} locationsStats athlete.stats.locations
 * @returns {Array}
 */
function getAllAvailableYears(locationsStats) {
  const allYears = Object.keys(locationsStats).reduce(
    (acc, loc) => [...acc, ...locationsStats[loc].availableYears],
    [],
  );
  return sortUniq(allYears);
}

/**
 * Set stats array of all years in which
 * athlete has any stats for any location
 *
 * @param {Athlete} athleteDoc
 * @param {Object} athleteStats
 */
async function setAthleteAvailableYears(athleteDoc, athleteStats = false) {
  const useStats = athleteStats || athleteDoc.stats;
  // Set array of all years in which athlete has any stats for any location
  const availableYears = sortUniq(
    Object.keys(useStats).reduce((acc, loc) => [
      ...acc,
      ...useStats[loc].availableYears,
    ], []),
  );

  athleteDoc.set({
    stats: {
      ...athleteDoc.stats,
      availableYears,
    },
    stats_version: 'v2',
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
 * @returns {Object} obj.locationName
 * @returns {Object} obj.stats
 */
async function ingestSingleLocation(
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

    await ingestor.fetchActivities();
    console.log(`Found ${ingestor.getNumActivities()} activities`);

    if (!ingestor.getNumActivities()) {
      return false;
    }

    ingestor.prepareActivities();
    const invalidActivities = ingestor.getInvalidActivities();
    const numInvalid = invalidActivities.length;

    if (numInvalid) {
      console.log(JSON.stringify(invalidActivities, null, 2));
    }

    if (numInvalid / ingestor.getNumActivities() > MAX_INVALID_ACTIVITIES) {
      captureSentry('Exceeded max % invalid activities', 'ingestAthleteHistory', {
        level: 'warning',
        tags: { dryRun: isDryRun ? '1' : '0' },
        extra: {
          athlete: athleteDoc.id,
          numInvalid,
          activities: JSON.stringify(ingestor.getInvalidActivitiesIds()),
        },
      });
      return {};
    }

    if (!isDryRun) {
      await ingestor.saveActivities();
    }

    // Regenerates complete stats from all activities
    // but only keeps a copy of this location's stats
    ingestor.generateStats();
    if (!isDryRun) {
      // Merges this location's stats
      // back into complete stats then saves
      // Not sure why I did it this way 🤷‍♂️
      await ingestor.saveStats();
    }

    return {
      locationName,
      stats: ingestor.getStats(),
    };
  } catch (err) {
    captureSentry(err, 'ingestSingleLocation', {
      extra: {
        locationName,
        canonicalSegmentId,
        athletedId: athleteDoc.id,
      },
    });
  }
  return false;
}

/**
 * Handle historical activities for new athlete
 *
 * @param {Athlete} Athlete athleteDoc
 * @param {Array|null} recdLocationsForIngest Array of location names, default to null
 * @param {Boolean} isDryRun Default to false
 */
async function ingestAthleteHistory(
  athleteDoc,
  recdLocationsForIngest = null,
  isDryRun = false,
) {
  // Make sure that we're not trying to ingest an empty array.
  // That would break stuff.
  let locationsForIngest;
  let locationsToLog;
  if (Array.isArray(recdLocationsForIngest) && recdLocationsForIngest.length) {
    locationsForIngest = recdLocationsForIngest;
    locationsToLog = `${locationsForIngest.join(', ')}
**Data for multi-location activites may be destroyed**`;
  } else {
    locationsForIngest = null;
    locationsToLog = 'All';
  }

  console.log(`----------------
Ingesting history for ${getAthleteIdentifier(athleteDoc)}
Locations: ${locationsToLog}
-------------------`);


  // Will check all known locations unless specified
  const asyncIngestAllLocations = makeArrayAsyncIterable(
    locationsForIngest || getLocationNames(),
    (loc) => ingestSingleLocation(loc, athleteDoc, { isDryRun }),
  );

  if (!isDryRun) {
    await clearAthleteHistoryV2(
      athleteDoc,
      locationsForIngest ? { location: { $in: locationsForIngest } } : {},
    );
  }

  // @todo revert back to existing athlete stats propery
  const allLocationsStats = {};

  // eslint-disable-next-line
  for await (const ingestResult of asyncIngestAllLocations) {
    if (ingestResult) {
      const {
        locationName,
        stats,
      } = ingestResult;
      allLocationsStats[locationName] = stats;
    }
  }

  if (!isDryRun) {
    await setAthleteAvailableYears(athleteDoc, allLocationsStats);
    // @todo
  }

  if (!isDryRun) {
    // YAY WE MADE IT!
    athleteDoc.set({ status: 'ready' });
    await athleteDoc.save();
  }

  if (!isDryRun) {
    const summary = Object.keys(allLocationsStats).reduce((acc, loc) => ({
      ...acc,
      [loc]: {
        total: allLocationsStats[loc].allTime,
        activites: allLocationsStats[loc].numActivities,
      },
    }), {});
    slackSuccess(`Ingested athlete history for ${athleteDoc.id}`, summary);
  }

  console.log(`
--------RESULTS---------
Ingested athlete history for ${athleteDoc.id}:
${JSON.stringify(allLocationsStats, null, 2)}
${isDryRun ? '**THIS WAS A DRY RUN**' : ''}`);
}

module.exports = {
  ingestAthleteHistory,
  ingestSingleLocation,
  setAthleteAvailableYears,
  getAllAvailableYears,
};
