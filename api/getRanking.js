const Athlete = require('../schema/Athlete');
const {
  allowedRankingTypes,
  allowedSpecialFilters,
  rankingPerPage,
} = require('./apiConfig');
const { defaultAthleteFields } = require('../config');

/**
 * Validate ranking type and segment ID
 * @param {String} rankingType
 * @param {String} filter
 * @return {Object}
 */
function validateInput(rankingType, filter = '') {
  if (allowedRankingTypes.indexOf(rankingType) === -1) {
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

  if (rankingType === 'special' && allowedSpecialFilters.indexOf(filter) === -1) {
    return { error: `Invalid special filter: ${filter}` };
  }

  return { error: false };
}

/**
 * Get key for athletes collection query
 * Note that rankingType and filter have already been validated at this point
 *
 * @param {String} rankingType
 * @param {String} filter
 * @return {String}
 */
function getStatsKey(rankingType = 'allTime', filter = '') {
  let key;
  switch (rankingType) {
    case 'timePeriod':
      key = filter;
      break;

    case 'special':
      key = `special.${filter}`;
      break;

    default:
      key = rankingType;
  }

  return `stats.${key}`;
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

  const statsKey = getStatsKey(rankingType, filter);

  // Default to first page, 0-based
  const page = query.page && !isNaN(query.page) ?
    parseInt(query.page, 10) - 1 :
    0;

  // Allow limit query param
  const limit = query.per_page && !isNaN(query.per_page) ?
    parseInt(query.per_page, 10) :
    rankingPerPage;

  // Calculate offset
  const skip = limit * page;

  const ranking = await Athlete.find(
    {
      [statsKey]: { $gt: 0 },
      status: { $ne: 'deauthorized' },
    },
    defaultAthleteFields.join(' ').replace('stats', statsKey),
    {
      limit,
      skip,
      sort: { [statsKey]: -1 },
    }
  );

  return { error: false, data: {
    statsKey: statsKey.replace(/^stats\./, ''), // remove leading `stats.`
    ranking,
  } };
}

module.exports = getRanking;
