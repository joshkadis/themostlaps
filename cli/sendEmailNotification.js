const Athlete = require('../schema/Athlete');
const {
  sendMonthlyEmail,
  sendMonthlyListEmail,
  sendIngestEmail,
} = require('../utils/emails');
const { shouldSendMonthlyEmail } = require('../utils/emails');
const { listAliases } = require('../config/email');

/**
 * Send email to Mailgun list
 *
 * @param {Number} listIdx Index of list alias in listAliases
 */
async function sendToList(listIdx) {
  if (!listAliases[listIdx]) {
    console.log(`Index ${listIdx} not found in listAliases`);
    process.exit(0);
  }

  const result = await sendMonthlyListEmail(listAliases[listIdx]);
  if (result) {
    console.log(`Email sent successfully to ${listAliases[listIdx]}`);
  } else {
    console.log(`Email failed to send to ${listAliases[listIdx]}`);
  }
  process.exit(0);
}

/**
 * Send email notification to user
 *
 * @param {Number|Document} userId Id or Athlete document
 * @param {String} type 'monthly' or 'ingest'
 * @param {Bool} shouldExitProcess Defaults to true, will exit process after sending. false to return
 * @return {Bool} Sent successfully?
 */
async function sendEmailNotification(userId, type, shouldExitProcess = true) {
  // List alias w/ general sanity check
  if ('number' === typeof userId &&
    userId < listAliases.length &&
    userId < 30 &&
    'monthly' === type
  ) {
    await sendToList(userId);
    return;
  }

  const athleteDoc = 'number' === typeof userId ?
    await Athlete.findById(userId) :
    userId;

  if (!athleteDoc) {
    console.log(`Could not find user id ${userId}`);
    if (shouldExitProcess) {
      process.exit(0);
    } else {
      return false;
    }
  }

  if (!process.env.MAILGUN_API_KEY) {
    console.log('Missing Mailgun API key')
    if (shouldExitProcess) {
      process.exit(0);
    } else {
      return false;
    }
  }

  let result;
  if ('monthly' === type) {
    // Check if user wants monthly emails
    // const { notifications } = athleteDoc.get('preferences');
    // if (!notifications[type]) {
    //   console.log(`User has opted out of ${type} emails`);
    //   if (shouldExitProcess) {
    //     process.exit(0);
    //   } else {
    //     return false;
    //   }
    // }

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

  if (shouldExitProcess) {
    process.exit(0);
  } else {
    return false;
  }
}

module.exports = sendEmailNotification;
