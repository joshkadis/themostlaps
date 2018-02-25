const Athlete = require('../schema/Athlete');
const apiConfig = require('./apiConfig');

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
 * @param {String} filter
 */
async function getRanking(rankingType = null, filter = false) {
  const validation = validateInput(rankingType, filter);
  if (validation.error) {
    return validation;
  }

  const findStatsKey = 'timePeriod' === rankingType ? filter : rankingType;

  const ranking = await Athlete.find(
    {},
    `id athlete.firstname athlete.lastname stats.${findStatsKey}`,
    {
      limit: 20,
      sort: { [`stats.${findStatsKey}`]: -1 } },
  );

  return { error: false, data: {
    rankingType,
    filter,
    ranking,
  } };
}

module.exports = getRanking;