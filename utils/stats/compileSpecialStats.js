/**
 * Update athlete special stats data from new activity
 *
 * @param {Number} laps
 * @param {String} activityDateStr ISO string of activity local start time
 * @param {Object} stats Existing stats, may be empty object
 * @return {Object} Updated stats object
 */
function compileSpecialStats(laps, activityDateStr, stats = {}) {
  return Object.assign(
    {},
    stats,
    { giro2018: compileGiro2018(laps, activityDateStr, stats.giro2018 || 0) }
  );
}

/**
 * Update Giro 2018 from new activity
 *
 * @param {Number} laps
 * @param {String} activityDateStr ISO string of activity local start time
 * @param {Number} currentTotal Existing Giro 2018 total, may be 0
 * @return {Number} Updated Giro 2018 total
 */
function compileGiro2018(laps, activityDateStr, currentTotal) {
  const matches = /^(\d{4,4})-(\d{2,2})-(\d{2,2})/.exec(activityDateStr);

  if (!matches) {
    return currentTotal;
  }

  const activityDay = parseInt(matches[3], 10);

  // Giro runs from May 4-27 w 3 rest days
  if (
    matches[1] == '2018' &&
    matches[2] == '05' &&
    activityDay >= 4 &&
    activityDay <= 27 &&
    activityDay !== 7 &&
    activityDay !== 14 &&
    activityDay !== 21
  ) {
    return currentTotal + laps;
  }

  return currentTotal;
}

module.exports = {
  compileSpecialStats,
  compileGiro2018,
};
