const Athlete = require('../schema/Athlete');
const apiConfig = require('./apiConfig');
const { defaultAthleteFields } = require('../config');

/**
 * Validate ranking type and segment ID
 * @param {String} rankingType
 * @param {String} filter
 * @return {Object}
 */
function validateInput(rankingType, filter = '') {
  if (apiConfig.rankingTypes.indexOf(rankingType) === -1) {
    return { error: `Invalid ranking type: ${rankingType}` };
  }

  // Matches _YYYY_MM or _YYYY format
  // Will allow _2017_18 but we can live with that
  const timeRegex = /^_20[1-2]\d(?:_[0-1]\d)?$/;

  if (rankingType === 'timePeriod' &&
    !timeRegex.test(filter.toString())
  ) {
    return { error: `Invalid timePeriod filter: ${filter}` };
  }

  return { error: false };
}

/**
 * Get ranking for API request
 *
 * @param {String} rankingType
 * @param {Object} query
 */
async function getRanking(rankingType = null, query) {
  const filter = query.filter || false;
  const validation = validateInput(rankingType, filter);
  if (validation.error) {
    return validation;
  }

  // If request is for specific time period, use that as the stats key
  // otherwise use the ranking type (allTime, single, etc)
  const statsKey = 'timePeriod' === rankingType ? filter : rankingType;

  // Default to first page, 0-based
  const page = query.page && !isNaN(query.page) ?
    parseInt(query.page, 10) - 1 :
    0;

  // Allow limit query param
  const limit = query.per_page && !isNaN(query.per_page) ?
    parseInt(query.per_page, 10) :
    apiConfig.rankingPerPage;

  // Calculat offset
  const skip = limit * page;

  const ranking = await Athlete.find(
    { [`stats.${statsKey}`]: { $gt: 0 } },
    defaultAthleteFields.join(' ').replace('stats', `stats.${statsKey}`),
    {
      limit,
      skip,
      sort: { [`stats.${statsKey}`]: -1 },
    }
  );

  return { error: false, data: {
    statsKey,
    ranking,
  } };
}

module.exports = getRanking;