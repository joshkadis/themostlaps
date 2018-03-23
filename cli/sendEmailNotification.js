const Athlete = require('../schema/Athlete');
const { sendMonthlyEmail } = require('../utils/emails');

async function sendEmailNotification(userId, type) {
  const athleteDoc = await Athlete.findById(userId);

  if (!athleteDoc) {
    console.log(`Could not find user id ${userId}`);
    process.exit(0);
  }

  if (!process.env.MAILGUN_API_KEY) {
    console.log('Missing Mailgun API key')
    process.exit(0);
  }

  const result = await sendMonthlyEmail(athleteDoc);

  if (result) {
    console.log('Email sent successfully!');
  } else {
    console.log('Email failed to send');
  }

  process.exit(0);
}

module.exports = sendEmailNotification;
