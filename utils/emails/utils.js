const { getEnvOrigin } = require('../envUtils');
const { htmlSubjects } = require('../../config/email');

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
function getHTMLEmailTitle(type = 'default') {
  return htmlSubjects[type] || htmlSubjects.default;
}

/**
 * Get some sort of Nice work! type of phrase based on number of laps
 *
 * @param {Number} laps
 * @return {String}
 */
function getNiceWork(laps) {
  if (laps < 10) {
    return 'Time to get on the bike!';
  } else if (laps < 25) {
    return `It's a start!`;
  } else if (laps < 50) {
    return 'Pretty solid!';
  }

  return 'Nice work!';
}

/**
 * Get personal note for number of laps during month
 *
 * @param {Number} laps
 * @param {String} monthName
 * @return {String}
 */
function getPersonalUpdate(laps, monthName) {
  return `You rode ${laps} lap${laps > 1 ? 's' : ''} in ${monthName}. ${getNiceWork(laps)}`
}

/**
 * Get body HTML for monthly email
 *
 * @param {String|null} firstname Name or null for list
 * @param {String} monthName E.g. "December"
 * @param {Number} laps Number of laps ridden in month
 * @param {String} updateContent HTML content
 * @return {String} HTML for email body
 */
function getMonthlyHTMLBody(firstname, monthName, laps, updateContent = '') {
  return [
    `<p>Hello${firstname ? ` ${firstname}` : ''}!</p>`,
    (laps > 0 ?
     `<p>${getPersonalUpdate(laps, monthName)}</p>` :
     ''
    ),
    updateContent,
  ].join("\n");
}

/**
 * Get body HTML for ingest email
 *
 * @param {String} firstname
 * @param {Number} id
 * @return {String} HTML for ingest body
 */
function getIngestHTMLBody(firstname, id) {
  return `
<p>Hello ${firstname}!</p>
<p>Welcome to The Most Laps, where you can track and compare the only cycling stat that matters – Prospect Park laps.</p>
<p>Now would be a good time to share your <a href="${getEnvOrigin()}/rider/${id}">rider page</a> or follow <strong>@themostlaps</strong> on <a href="https://twitter.com/themostlaps">Twitter</a> or <a href="https://instagram.com/themostlaps">Instagram</a>.
<p>As a reminder, your stats are publicly visible on your page and in the rankings, and you will not need to log in through Strava again.</p>
<p>If you have any questions, <a href="mailto:info@themostlaps.com">send us an email</a> or check out the <a href="${getEnvOrigin()}/about">about page</a>.
<p>See you in the park!</p>`;
}


/**
 * Get HTML email footer content
 *
 * @param {String} type
 * @param {String} hash
 * @return {String} HTML for email footer
 */
function getHTMLFooter(type, unsubLink = false) {
  const base = `<p>Email sent by <a href="${getEnvOrigin()}">The Most Laps</a>.</p>`;
  if (!unsubLink) {
    return base;
  }

  return `${base}
<p>To unsubscribe from ${type} updates, <a href="${unsubLink}">click here</a>.</p>`;
}

module.exports = {
  shouldSendMonthlyEmail,
  getHTMLEmailTitle,
  getMonthlyHTMLBody,
  getIngestHTMLBody,
  getHTMLFooter,
  getPersonalUpdate,
};
