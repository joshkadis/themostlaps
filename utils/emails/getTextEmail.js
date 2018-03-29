const { getEnvOrigin } = require('../envUtils');

/**
 * Get plain-text email
 *
 * @param {String} firstname
 * @param {String} monthYearLong E.g. "December 2017"
 * @param {Number} laps
 * @param {String} year YYYY
 * @param {String} month MM
 * @param {String} unsub
 * @return {String} Text of email
 */
const getTextEmail = (
  firstname,
  monthYearLong,
  laps,
  year,
  month,
  unsubHash,
) => `Hello ${firstname}!

This is your monthly update for ${monthYearLong}...You rode ${laps} laps!

Come see the rankings at ${getEnvOrigin()}/ranking/${year}/${month}

- The Most Laps

PS - Click here to stop monthly updates: ${getEnvOrigin()}/notifications/${unsubHash}`;

module.exports = getTextEmail;
