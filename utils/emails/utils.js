const { getEnvOrigin } = require('../envUtils');

/**
 * Check user preference and date before sending monthly email on 1st of the month
 *
 * @param {Document} athleteDoc
 * @param {Number} sendOnDate 1-based day of month to send on
 * @return {Bool}
 */
function shouldSendMonthlyEmail(athleteDoc = false, sendOnDate = 1) {
  if (!athleteDoc) {
    return false;
  }

  const { notifications } = athleteDoc.get('preferences');

  if (!notifications.monthly) {
    return false;
  }

  const current = new Date();
  return current.getDate() === sendOnDate;
}

/**
 * Get title for HTML email
 *
 * @param {String} type
 */
function getHTMLEmailTitle(type = false) {
  switch (type) {
    case 'monthly':
      return 'Your Monthly Update';

    default:
      return 'A message from The Most Laps';
  }
}

/**
 * Get body HTML for monthly email
 *
 * @param {String} firstname
 * @param {String} monthYearLong E.g. "December 2017"
 * @param {Number} laps
 * @param {String} year YYYY
 * @param {String} month MM
 * @return {String} HTML for email body
 */
function getMonthlyHTMLBody(firstname, monthYearLong, laps, year, month) {
  return `
<p>Hello ${firstname}!</p>
<p>This is your monthly update for ${monthYearLong}...you rode <strong>${laps} laps!</strong></p>
<p>Come see the rankings at ${getEnvOrigin()}/ranking/${year}/${month}</p>
<p>- <em>The Most Laps</em></p>`;
}

/**
 * Get HTML email footer content
 *
 * @param {String} type
 * @param {String} hash
 * @return {String} HTML for email footer
 */
function getHTMLFooter(type, hash) {
  const unsubUrl = `${getEnvOrigin()}/notifications/${hash}`;
  return `
<p>Email sent by <a href="${getEnvOrigin()}">The Most Laps</a>.</p>
<p>To unsubscribe from these ${type} updates, <a href="${unsubUrl}">click here</a>.</p>
`;
}

module.exports = {
  shouldSendMonthlyEmail,
  getHTMLEmailTitle,
  getMonthlyHTMLBody,
  getHTMLFooter,
};
