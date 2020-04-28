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

function checkLocation(athlete, allActivities, locName) {
  const locStats = athlete.stats.locations[locName] || null;
  if (!locStats) {
    console.log(`!locStats, athlete ${athlete._id}`);
    return false;
  }

  let numActivities = 0;
  let numMultiLocActivities = 0;
  let totalLaps = 0;
  let lapsFromMulti = 0;

  allActivities.forEach((act) => {
    // As primary location
    if (act.location === locName) {
      numActivities += 1;
      totalLaps += act.laps;
      return;
    }
    // From multi-location activities
    act.activityLocations.forEach((subLoc) => {
      if (subLoc.location === locName) {
        numMultiLocActivities += 1;
        lapsFromMulti += subLoc.laps;
      }
    });
  });

  // whatever, close enough if these match
  const allNumActivities = numActivities + numMultiLocActivities;
  const allLaps = totalLaps + lapsFromMulti;

  if (
    numActivities !== locStats.numActivities
    && allNumActivities !== locStats.numActivities
  ) {
    console.table({
      locStats: locStats.numActivities,
      numActivities,
      numMultiLocActivities,
      athlete_id: athlete._id,
    });
    return false;
  }

  if (
    totalLaps !== locStats.allTime
    && allLaps !== locStats.allTime
  ) {
    console.table({
      locStats: locStats.allTime,
      totalLaps,
      lapsFromMulti,
      athlete_id: athlete._id,
    });
    return false;
  }

  return true;
}

async function qaAthlete(athlete, location = 'centralpark') {
  const {
    _id: id,
    migration = {},
    stats_version = '',
    app_version = '',
    legacyStats = {},
    stats: {
      locations = {},
    },
  } = athlete;

  // Check basic stuff
  const didMigration = (
    migration.athleteStats
    && migration[`ingest${location}`]
    && stats_version === 'v2'
    && app_version === 'v1'
  );
  if (!didMigration) {
    return { success: false, id };
  }

  // Check folks w/ no laps ever
  if (!legacyStats.allTime) {
    const qaSuccess = await qaNoLapsAthlete(athlete);
    if (!qaSuccess) {
      return { success: false, id };
    }
    return { success: true };
  }

  // Quick PP-specific check
  try {
    const allTimeOk = legacyStats.allTime === locations.prospectpark.allTime;
    if (!allTimeOk) {
      console.log(`!allTimeOk, athlete ${athlete._id}`);
      return { success: false, id };
    }
  } catch (err) {
    return { success: false, id };
  }

  const activities = await Activity.find({ athlete_id: id });
  if (!activities.length) {
    console.log(`!activities.length, athlete ${athlete._id}`);
    return { success: false, id };
  }

  // Check each location
  let locationsOk = true;
  Object.keys(locations).forEach((locName) => {
    const locationChecked = checkLocation(athlete, activities, locName);
    if (!locationChecked) {
      console.log(`!locationChecked ${locName}, athlete ${athlete._id}`);
      locationsOk = false;
    }
  });

  if (!locationsOk) {
    return { success: false, id };
  }

  return { success: true };
}

module.exports = qaAthlete;
