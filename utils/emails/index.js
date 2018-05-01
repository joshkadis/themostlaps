const fs = require('fs');
const path = require('path');
const remark = require('remark');
const remarkHtml = require('remark-html');

const { timePartString, getMonthName, getMonthKey } = require('../dateTimeUtils');
const sendMailgun = require('./sendMailgun');
const {
  getTextMonthlyEmail,
  getTextIngestEmail,
} = require('./getTextEmail');
const getHTMLEmail = require('./getHTMLEmail');
const {
  getHTMLEmailTitle,
  getMonthlyHTMLBody,
  getIngestHTMLBody,
  getHTMLFooter,
} = require('./utils');
const { encrypt } = require('../encryption');

/**
 * Get _YYYY_MM key for *last month* relative to today's date
 *
 * @param {Date} current
 * @return {Array} [YYYY, MM]
 */
function getLastMonth(current) {
  // getMonth() is 0-based index and our app uses 1-based
  const lastMonth = current.getMonth() !== 0 ? current.getMonth() : 12;
  let lastMonthYear = current.getFullYear();
  if (lastMonth === 12) {
    lastMonthYear = lastMonthYear - 1;
  }
  return [lastMonthYear.toString(), timePartString(lastMonth)];
}

/**
 * Get Markdown content for monthly update
 *
 * @param {Date} dateObj Optional, defaults to current date
 * @return {Object} content
 * @return {String} content.raw Raw Markdown
 * @return {String} content.html HTML from Markdown
 * @return {String} content.filename Filename
 */
async function getMonthlyUpdateContent(dateObj = false) {
  dateObj = dateObj || new Date();
  const filename = `update_${getMonthKey(dateObj, '')}.md`;

  let raw = '';
  let markdown = '';
  try {
    raw = fs.readFileSync(path.resolve(__dirname, `../../copy/emails/${filename}`), 'utf8');
    markdown = await remark()
      .use(remarkHtml)
      .process(raw)
      .then((file) => String(file));
  } catch (err) {
    // all good
  }

  return { filename, raw, markdown };
}

/**
 * Send monthly email update
 *
 * @param {Document} athleteDoc
 * @return {Bool} Success or fail
 */
async function sendMonthlyEmail(athleteDoc) {
  const to = athleteDoc.get('athlete.email');
  const firstname = athleteDoc.get('athlete.firstname');
  const current = new Date();
  const lastMonth = getLastMonth(current);
  const lastMonthLaps = athleteDoc.get(`stats._${lastMonth[0]}_${lastMonth[1]}`);
  const monthYearLong = `${getMonthName(parseInt(lastMonth[1], 10))} ${lastMonth[0]}`;
  const unsubHash = encrypt(JSON.stringify({
    id: athleteDoc.get('_id'),
    action: 'unsub',
    type: 'monthly'
  }));
  const subject = getHTMLEmailTitle('monthly');
  const updateContent = await getMonthlyUpdateContent(current);
  const sendResult = await sendMailgun({
    to,
    subject,
    text: getTextMonthlyEmail(
      firstname,
      monthYearLong,
      lastMonthLaps,
      lastMonth[0],
      lastMonth[1],
      unsubHash,
    ),
    html: await getHTMLEmail(
      getMonthlyHTMLBody(
        firstname,
        monthYearLong,
        lastMonthLaps,
        lastMonth[0],
        lastMonth[1],
      ),
      getHTMLFooter('monthly', unsubHash),
    ),
  });

  return sendResult;
}

/**
 * Send ingest email
 *
 * @param {Document} athleteDoc
 * @return {Bool} Success or fail
 */
async function sendIngestEmail(athleteDoc) {
  const to = athleteDoc.get('athlete.email');
  const id = athleteDoc.get('_id');
  const firstname = athleteDoc.get('athlete.firstname');
  const subject = getHTMLEmailTitle('ingest');

  const sendResult = await sendMailgun({
    to,
    subject,
    text: getTextIngestEmail(firstname, id),
    html: await getHTMLEmail(
      subject,
      getIngestHTMLBody(firstname, id),
      getHTMLFooter('ingest'),
    ),
  });

  return sendResult;
}

module.exports = {
  sendMonthlyEmail,
  sendIngestEmail,
  getMonthlyUpdateContent,
};
