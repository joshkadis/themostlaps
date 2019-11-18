const Athlete = require('../schema/Athlete');
const { defaultAthleteFields } = require('../config');

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

  return {
    error: false,
    data: athletes.map((athlete) => athlete.toJSON()),
  };
}

module.exports = getAthletes;
