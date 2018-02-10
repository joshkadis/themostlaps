const Athlete = require('../schema/Athlete');
const apiConfig = require('./apiConfig');
const { lapSegmentId } = require('../config');

/**
 * Validate ranking type and segment ID
 * @param {String} rankingType
 * @param {Number} segmentId
 */
function validateInput(rankingType, segmentId) {
  if (apiConfig.rankingTypes.indexOf(rankingType) === -1) {
    return { error: `Invalid ranking type: ${rankingType}` };
  }

  if (lapSegmentId !== segmentId){
    return { error: `Invalid segment ID: ${segmentId}` };
  }

  return { error: false };
}

/**
 * Get Find filter for ranking type
 *
 * @param {String} rankingType
 * @return {Object}
 */
function getRankingTypeFilter(rankingType) {
  return apiConfig.rankingTypeFilters[rankingType] || {};
}

/**
 * Get ranking for API request
 *
 * @param {String} rankingType
 * @param {Number} segmentId
 * @param {String} filter
 */
async function getRanking(rankingType = null, segmentId = null, filter = false) {
  const validation = validateInput(rankingType, segmentId);
  if (validation.error) {
    return validation;
  }

  const ranking = await Athlete.find(
    {},
    `id athlete.firstname athlete.lastname stats.${rankingType}`,
    {
      limit: 20,
      sort: { [`stats.${rankingType}`]: -1 } },
  );

  return { error: false, data: {
    rankingType,
    segmentId,
    ranking,
  } };
}

module.exports = getRanking;