const { timePartString, getMonthName } = require('../dateTimeUtils');
const sendMailgun = require('./sendMailgun');
const {
  getTextMonthlyEmail,
  getTextIngestEmail,
} = require('./getTextEmail');
const getHTMLEmail = require('./getHTMLEmail');
const {
  getHTMLEmailTitle,
  getMonthlyHTMLBody,
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

  const sendResult = await sendMailgun({
    to,
    text: getTextMonthlyEmail(
      firstname,
      monthYearLong,
      lastMonthLaps,
      lastMonth[0],
      lastMonth[1],
      unsubHash,
    ),
    html: await getHTMLEmail(
      getHTMLEmailTitle('monthly'),
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

  const sendResult = await sendMailgun({
    to,
    text: getTextIngestEmail(firstname, id),
    html: await getHTMLIngestEmail(
      getHTMLEmailTitle('monthly'),
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

module.exports = {
  sendMonthlyEmail,
  sendIngestEmail,
};
