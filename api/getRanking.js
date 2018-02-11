const Athlete = require('../schema/Athlete');
const apiConfig = require('./apiConfig');
const { lapSegmentId } = require('../config');

/**
 * Validate ranking type and segment ID
 * @param {String} rankingType
 * @param {Number} segmentId
 * @param {String} filter
 * @return {Object}
 */
function validateInput(rankingType, segmentId, filter = '') {
  if (apiConfig.rankingTypes.indexOf(rankingType) === -1) {
    return { error: `Invalid ranking type: ${rankingType}` };
  }

  if (lapSegmentId !== segmentId){
    return { error: `Invalid segment ID: ${segmentId}` };
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
 * @param {Number} segmentId
 * @param {String} filter
 */
async function getRanking(rankingType = null, segmentId = null, filter = false) {
  const validation = validateInput(rankingType, segmentId, filter);
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
    segmentId,
    ranking,
  } };
}

module.exports = getRanking;