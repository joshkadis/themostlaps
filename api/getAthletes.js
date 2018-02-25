const Athlete = require('../schema/Athlete');

const fields = [
  'id',
  'athlete.firstname',
  'athlete.lastname',
  'athlete.profile',
  'stats',
].join(' ');

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
 * @return {Object} key-value pairs as athleteId: { data }
 */
async function getAthletes(idsString = '') {
  const athleteIds = parseIdsString(idsString);
  if (!athleteIds.length) {
    return { error: 'Missing athlete ids' };
  }

  const athletes = await Athlete.find({ _id: { $in: athleteIds } }, fields);

  return {
    error: false,
    data: athletes.map((athlete) => athlete.toJSON())
  };
}

module.exports = getAthletes;
