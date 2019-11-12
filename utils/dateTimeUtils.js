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
  dateObj = dateObj || new Date();
  return [
    delimiter,
    dateObj.getFullYear(),
    delimiter,
    timePartString(dateObj.getMonth() + 1),
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

module.exports = {
  timePartString,
  getYearKey,
  getMonthKey,
  getMonthName,
};
