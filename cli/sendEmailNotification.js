const Athlete = require('../schema/Athlete');
const {
  sendMonthlyEmail,
  sendMonthlyListEmail,
  sendIngestEmail,
} = require('../utils/emails');
const { shouldSendMonthlyEmail } = require('../utils/emails');
const { listAliases } = require('../config/email');

async function sendEmailNotification(userId, type) {
  // List alias w/ general sanity check
  if (userId < listAliases.length &&
    userId < 30 &&
    'monthly' === type
  ) {
    await sendMonthlyListEmail(listAliases[userId]);
    return;
  }

  const athleteDoc = await Athlete.findById(userId);

  if (!athleteDoc) {
    console.log(`Could not find user id ${userId}`);
    process.exit(0);
  }

  if (!process.env.MAILGUN_API_KEY) {
    console.log('Missing Mailgun API key')
    process.exit(0);
  }

  let result;
  if ('monthly' === type) {
    // Check if user wants monthly emails
    const { notifications } = athleteDoc.get('preferences');
    if (!notifications[type]) {
      console.log(`User has opted out of ${type} emails`);
      process.exit(0);
    }
    result = await sendMonthlyEmail(athleteDoc);
  } else if ('ingest' === type) {
    // Send ingest email
    result = await sendIngestEmail(athleteDoc);
  } else {
    // Unknown type
    console.log(`Email type ${type} not recognized`);
    result = false;
  }

  if (result) {
    console.log('Email sent successfully!');
  } else {
    console.log('Email failed to send');
  }

  process.exit(0);
}

module.exports = sendEmailNotification;
