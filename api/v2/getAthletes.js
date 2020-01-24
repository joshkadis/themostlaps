const Athlete = require('../../schema/Athlete');
const {
  defaultAthleteFields,
} = require('../../config');
const { transformStats } = require('../../utils/v2/stats/transformStats');
const { makeArrayAsyncIterable } = require('../../utils/v2/asyncUtils');
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

/**
 * Get data for athletes API request
 *
 * @param {String} idsString Comma-separated string of athlete ids
 * @param {String} locations CSV string locations to return in Query results
 * @return {Array}
 */
async function getAthletes(idsString = '') {
  const athleteIds = parseIdsString(idsString);
  if (!athleteIds.length) {
    return { error: 'Requires at least one numeric id' };
  }

  const athletes = await Athlete.find(
    {
      _id: { $in: athleteIds },
      status: { $ne: 'deauthorized' },
    },
    `${defaultAthleteFields.join(' ')} stats_version`,
    { lean: true },
  );

  const mappedAthletes = [];
  const athleteIterator = makeArrayAsyncIterable(
    athletes,
    async (athlete) => {
      if (athlete.stats_version === 'v2') {
        return athlete;
      }
      const transformedStats = await transformStats(athlete.stats, athlete._id);
      return {
        ...athlete,
        stats: transformedStats,
      };
    },
  );

  // eslint-disable-next-line
  for await (const athlete of athleteIterator) {
    mappedAthletes.push(athlete);
  }

  return {
    error: false,
    data: mappedAthletes,
  };
}

module.exports = {
  getAthletes,
};
