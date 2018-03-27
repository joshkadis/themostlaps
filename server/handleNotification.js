const { decrypt } = require('../utils/encryption');
const { slackError } = require('../utils/slackNotification');

/**
 * Handle notification route
 *
 * @param {String} cipher
 * @param {Response} res
 */
async function handleNotification(encrypted, res) {
  const decrypted = JSON.parse(decrypt(encrypted));
  if ('undefined' === typeof decrypted || !decrypted) {
    slackError(100, encrypted);
    return;
  }

  const { id, action, type } = decrypted;

  // Get Athlete doc from ID

  // Update notification pref

  // Show confirmation screen
}

module.exports = handleNotification;
