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
const getTextMonthlyEmail = (
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

/**
 * Get plain-text email
 *
 * @param {String} firstname
 * @param {Number} id
 * @return {String} Text of email
 */
const getTextMonthlyEmail = (
  firstname,
  id,
) => `Hello ${firstname}!

Welcome to The Most Laps, where you can track and compare the only cycling stat that matters – Prospect Park laps.

Now would be a good time to share your rider page (${getEnvOrigin()}/rider/${id}) or follow @themostlaps on Twitter or Instagram.

As a reminder, your stats are publicly visible on your page and in the rankings, and you will not need to log in through Strava again.

If you have any questions, send an email to info@themostlaps.com or check out ${getEnvOrigin()}/about.

See you in the park!`;

module.exports = {
  getTextMonthlyEmail,
  getTextIngestEmail,
};
