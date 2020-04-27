const _unset = require('lodash/unset');
const _cloneDeep = require('lodash/cloneDeep');
const {
  ingestSingleLocation,
  getAllAvailableYears,
} = require('../../utils/v2/ingestAthlete/ingestAthleteHistory');

const ingestLocationForAthlete = async (
  athleteDoc,
  location,
  migrationKey,
  isDryRun,
) => {
  // eslint-disable-next-line
  console.log(`${"\n"}Ingesting athlete ${athleteDoc.id}`);

  await ingestSingleLocation(
    location,
    athleteDoc,
    isDryRun,
  );

  athleteDoc.set({
    stats: {
      ...athleteDoc.stats,
      availableYears: getAllAvailableYears(athleteDoc.stats.locations),
    },
    migration: {
      ...(athleteDoc.migration || {}),
      [migrationKey]: true,
    },
  });
  athleteDoc.markModified('stats');
  athleteDoc.markModified('migration');
  if (!isDryRun) {
    await athleteDoc.save();
  }
};

const resetLocationForAthlete = async (
  athleteDoc,
  location,
  migrationKey,
  isDryRun,
) => {
  // eslint-disable-next-line
  console.log(`${"\n"}Resetting athlete ${athleteDoc.id}`);
  const {
    locations: topLevelLocations,
    migration: prevMigration,
    stats: prevStats,
  } = athleteDoc;

  // reset athlete.locations
  const nextLocations = topLevelLocations.filter((loc) => loc !== location);

  // reset migration.ingest${location}
  const nextMigration = {
    ...prevMigration,
    [migrationKey]: false,
  };

  // remove stats.locations[location]
  const nextLocationsStats = _cloneDeep(prevStats.locations);
  _unset(nextLocationsStats, location);

  // reset stats.availableYears
  const nextAvailableYears = getAllAvailableYears(nextLocationsStats);

  athleteDoc.set({
    migration: nextMigration,
    locations: nextLocations,
    stats: {
      ...athleteDoc.stats,
      locations: nextLocationsStats,
      availableYears: nextAvailableYears,
    },
  });
  athleteDoc.markModified('migration');
  athleteDoc.markModified('locations');
  athleteDoc.markModified('stats');

  if (!isDryRun) {
    await athleteDoc.save();
  }
};

module.exports = {
  ingestLocationForAthlete,
  resetLocationForAthlete,
};
