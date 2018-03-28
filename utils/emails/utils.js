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

module.exports = {
  shouldSendMonthlyEmail,
};
