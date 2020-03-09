const { rankingStartYear } = require('../config');

/**
 * Convert int to min. 2-digit string
 * Just assume a valid month, ok?
 *
 * @param {String|Number} part
 * @return {String}
 */
function timePartString(part) {
  const numPart = Number(part);
  if (numPart >= 10) {
    return numPart.toString();
  }
  return `0${numPart}`;
}

/**
 * Get _YYYY key
 *
 * @param {Number|String} year Optional 4-digit year
 * @return {String}
 */
function getYearKey(year = null) {
  // Must be 4 digit year in 21st century
  if (year && /20\d{2,2}/.test(year.toString())) {
    return `_${year}`;
  }

  const current = new Date();
  return `_${current.getFullYear()}`;
}

/**
 * Get _YYYY_MM key
 *
 * @param {Date} dateObj Optional Date, defaults to current
 * @param {Boolean} delimiter Optional, defaults to '_'
 * @return {String}
 */
function getMonthKey(dateObj = false, delimiter = '_') {
  const useDateObj = dateObj || new Date();
  return [
    delimiter,
    useDateObj.getFullYear(),
    delimiter,
    timePartString(useDateObj.getMonth() + 1),
  ].join('');
}

/**
 * Get month name from 1-12 index, not 0-11
 *
 * @param {Int} idx
 * @param {Int} chars Options chars to return, if undefined will return full string
 * @return {String}
 */
function getMonthName(idx, chars) {
  switch (idx) {
    case 1: return 'January'.slice(0, chars);
    case 2: return 'February'.slice(0, chars);
    case 3: return 'March'.slice(0, chars);
    case 4: return 'April'.slice(0, chars);
    case 5: return 'May'.slice(0, chars);
    case 6: return 'June'.slice(0, chars);
    case 7: return 'July'.slice(0, chars);
    case 8: return 'August'.slice(0, chars);
    case 9: return 'September'.slice(0, chars);
    case 10: return 'October'.slice(0, chars);
    case 11: return 'November'.slice(0, chars);
    case 12: return 'December'.slice(0, chars);
    default: return 'January'.slice(0, chars);
  }
}

/**
 * Is a year within the allowed range 2010+
 *
 * @param {String|Number} year
 * @returns {Bool}
 */
function isValidYear(year = 0) {
  // year must be 4-digit integer, not string like '2010.0'
  // 2010.0 as a float is fine, whatever
  if (!/^\d{4}$/.test(year.toString())) {
    return false;
  }
  const yearInt = Number(year);
  return yearInt >= rankingStartYear
    && yearInt <= new Date().getFullYear();
}

/**
 * Month represented by 1-based string or int is valid
 *
 * @param {String|Number} month
 */
function isValidMonth(month = 0) {
  // '01', '1', 1, '12', 12 are all ok
  // '12.0' is not ok, 12.0 is ok I guess
  return /^(0?[1-9]|1[0-2])$/.test(month.toString());
}

module.exports = {
  isValidMonth,
  isValidYear,
  timePartString,
  getYearKey,
  getMonthKey,
  getMonthName,
};
