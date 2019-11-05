const { omit } = require('lodash');
const Athlete = require('../../schema/Athlete');
const {
  defaultLocation,
  defaultAthleteFields,
} = require('../../config');

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

function handleLegacyAthleteStats(athlete) {
  const { stats } = athlete;
  if (!stats) {
    return athlete;
  }

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

  return {
    ...athlete,
    stats: {
      locations,
    },
  };
}

/**
 * Get data for athletes API request
 *
 * @param {String} idsString Comma-separated string of athlete ids
 * @param {Array} fields Array of fields to return in Query results
 * @return {Array}
 */
async function getAthletes(idsString = '', fields = defaultAthleteFields) {
  const athleteIds = parseIdsString(idsString);
  if (!athleteIds.length) {
    return { error: 'Requires at least one numeric id' };
  }

  const athletes = await Athlete.find(
    {
      _id: { $in: athleteIds },
      status: { $ne: 'deauthorized' },
    },
    fields.join(' '),
  );

  const mappedAthletes = athletes.map((athleteDoc) => {
    const athlete = athleteDoc.toJSON();
    return handleLegacyAthleteStats(athlete);
  });

  return {
    error: false,
    data: mappedAthletes,
  };
}

module.exports = {
  handleLegacyAthleteStats,
  getAthletes,
};
