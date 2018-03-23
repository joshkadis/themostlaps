const { domain, defaultSendOpts } = require('../../config/email');
const mailgun = require('mailgun-js')({
  apiKey: process.env.MAILGUN_API_KEY,
  domain,
});

/**
 * Send email via Mailgun to individual user
 *
 * @param {Object} msgOpts Must contain 'to' and 'text' fields at minimum
 * @return {Bool} Success or failure
 */
async function sendMailgun(msgOpts) {
  if (!process.env.MAILGUN_API_KEY) {
    console.log('Missing Mailgun API key');
    return;
  }

  try {
    const result = await mailgun
      .messages()
      .send(Object.assign({...defaultSendOpts}, msgOpts));
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
};

module.exports = sendMailgun;
