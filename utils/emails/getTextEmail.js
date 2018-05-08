const { getEnvOrigin } = require('../envUtils');
const { getPersonalUpdate } = require('./utils');
const { unsubTemplateTag } = require('../../config/email');

/**
 * Get plain-text email
 *
 * @param {String} updateContent
 * @return {String} Text of email
 */
const getTextMonthlyListEmail = (
  updateContent,
) => `Hello!

${updateContent}

PS - Click here to stop monthly updates: ${unsubTemplateTag}`;

/**
 * Get plain-text email
 *
 * @param {String} firstname
 * @param {String} monthName E.g. "December"
 * @param {Number} laps
 * @param {String} updateContent
 * @param {String} unsub
 * @return {String} Text of email
 */
const getTextMonthlyEmail = (
  firstname,
  monthName,
  laps,
  updateContent,
  unsubHash,
) => `Hello ${firstname}!

${getPersonalUpdate(laps, monthName)}

${updateContent}

PS - Click here to stop monthly updates: ${getEnvOrigin()}/notifications/${unsubHash}`;

/**
 * Get plain-text email for ingest
 *
 * @param {String} firstname
 * @param {Number} id
 * @return {String} Text of email
 */
const getTextIngestEmail = (
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
  getTextMonthlyListEmail,
  getTextIngestEmail,
};
