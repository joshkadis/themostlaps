const Athlete = require('../schema/Athlete');

const defaultFields = [
  'id',
  'athlete.firstname',
  'athlete.lastname',
  'athlete.profile',
  'stats',
];

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
      if (!isNaN(id) && acc.indexOf(id) === -1) {
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
async function getAthletes(idsString = '', fields = defaultFields) {
  const athleteIds = parseIdsString(idsString);
  if (!athleteIds.length) {
    return { error: 'Requires at least one numeric id' };
  }

  const athletes = await Athlete.find(
    { _id: { $in: athleteIds } },
    fields.join(' ')
  );

  return {
    error: false,
    data: athletes.map((athlete) => athlete.toJSON())
  };
}

module.exports = getAthletes;
