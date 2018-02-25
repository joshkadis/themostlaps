/**
 * Convert int to min. 2-digit string
 *
 * @param {Int} part
 * @return {String}
 */
function timePartString(part) {
  if (part >= 10) {
    return part.toString();
  }
  return `0${part}`;
};

/**
 * Get _YYYY key
 *
 * @return {String}
 */
function getYearKey() {
  const current = new Date();
  return `_${current.getFullYear()}`;
}

/**
 * Get _YYYY_MM key
 *
 * @return {String}
 */
function getMonthKey() {
  const current = new Date();
  return `_${current.getFullYear()}_${timePartString(current.getMonth() + 1)}`;
}

module.exports = {
  timePartString,
  getYearKey,
  getMonthKey,
};
