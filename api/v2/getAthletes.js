const { omit } = require('lodash');
const Athlete = require('../../schema/Athlete');
const {
  defaultLocation,
  defaultAthleteFields,
} = require('../../config');
const { getStatsForLocation } = require('../../utils/v2/stats/athleteStats');

/**
 * Parse CSV string of athlete IDs from URL
 *
 * @param {String} idsString Comma-separated string of athlete ids
 * @return {Array} Array of integer ids
 */
function parseIdsString(idsString) {
  return decodeURIComponent(idsString)
    .split(',')
    .reduce((acc, idStr) => {
      const id = parseInt(idStr, 10);
      if (!Number.isNaN(id) && acc.indexOf(id) === -1) {
        acc.push(id);
      }
      return acc;
    }, []);
}

function getV2AthleteStats(athlete, includeLocations = []) {
  const { stats } = athlete;
  if (!stats) {
    return athlete;
  }

  // Handle legacy stats not within stats.locations[location]
  let locations = {};
  if (!stats.locations) {
    // Consider entire stats object as the default location
    locations = {
      [defaultLocation]: stats,
    };
  } else if (!stats.locations[defaultLocation]) {
    // Consider entire stats object
    // except stats.locations as the default location
    const defaultLocationStats = omit(stats, 'locations');
    locations = {
      ...stats.locations,
      [defaultLocation]: defaultLocationStats,
    };
  } else {
    locations = stats.locations;
  }


  const transformedLocations = Object.keys(locations)
    .reduce((acc, location) => {
      if (!includeLocations.length // Include all locations if empty array
        || includeLocations.indexOf(location) !== -1 // Include specified locations
      ) {
        acc[location] = getStatsForLocation(locations, location);
      }
      return acc;
    }, {});

  return {
    ...athlete,
    stats: {
      locations: transformedLocations,
    },
  };
}

/**
 * Get data for athletes API request
 *
 * @param {String} idsString Comma-separated string of athlete ids
 * @param {String} locations CSV string locations to return in Query results
 * @return {Array}
 */
async function getAthletes(idsString = '', locationsCsv = 'all') {
  const athleteIds = parseIdsString(idsString);
  if (!athleteIds.length) {
    return { error: 'Requires at least one numeric id' };
  }

  const athletes = await Athlete.find(
    {
      _id: { $in: athleteIds },
      status: { $ne: 'deauthorized' },
    },
    defaultAthleteFields.join(' '),
  );

  const locations = locationsCsv === 'all'
    ? []
    : locationsCsv.split(',');

  const mappedAthletes = athletes.map((athleteDoc) => {
    const athlete = athleteDoc.toJSON();
    return getV2AthleteStats(athlete, locations);
  });

  return {
    error: false,
    data: mappedAthletes,
  };
}

module.exports = {
  getV2AthleteStats,
  getAthletes,
};
