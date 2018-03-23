const Athlete = require('../schema/Athlete');
const { sendMonthlyEmail } = require('../utils/emails');

async function sendEmailNotification(userId, type) {
  const athleteDoc = await Athlete.findById(userId);

  if (!athleteDoc) {
    console.log(`Could not find user id ${userId}`);
    process.exit(0);
  }

  await sendMonthlyEmail(athleteDoc);
}

module.exports = sendEmailNotification;
