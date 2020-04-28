const Activity = require('../../schema/Activity');

async function qaNoLapsAthlete(athlete) {
  const {
    _id: id,
    locations: topLevelLocations = false,
    stats: {
      availableYears = false,
      locations = false,
    },
  } = athlete;

  const validatedAthlete = (
    topLevelLocations
    && !topLevelLocations.length
    && availableYears
    && !availableYears.length
    && locations
    && !Object.keys(locations).length
  );

  if (!validatedAthlete) {
    return false;
  }

  const activities = await Activity.find(
    { athlete_id: Number(id) },
    '_id',
    { lean: true },
  );
  return !activities.length;
}

async function qaAthlete(athlete, location = 'centralpark') {
  const {
    _id: id,
    migration = {},
    stats_version = '',
    app_version = '',
    legacyStats = {},
  } = athlete;

  const didMigration = (
    migration.athleteStats
    && migration[`ingest${location}`]
    && stats_version === 'v2'
    && app_version === 'v1'
  );
  if (!didMigration) {
    return { success: false, id };
  }

  if (!legacyStats.allTime) {
    const qaSuccess = await qaNoLapsAthlete(athlete);
    if (!qaSuccess) {
      return { success: false, id };
    }
  }
  return { success: true };
}

module.exports = qaAthlete;
