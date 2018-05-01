const Athlete = require('../schema/Athlete');
const { decrypt } = require('../utils/encryption');
const { slackError, slackSuccess } = require('../utils/slackNotification');
const {
  notificationTypes,
  notificationActions,
  notificationSubscribeAction,
} = require('../config');

/**
 * Handle notification route
 *
 * @param {String} encrypted
 * @return {Bool}
 */
async function handleNotification(encrypted) {
  let decrypted;
  try {
    decrypted = JSON.parse(decrypt(encrypted));
  } catch (err) {
    slackError(100, encrypted);
    return false;
  }

  if ('undefined' === typeof decrypted || !decrypted) {
    slackError(101, encrypted);
    return false;
  }

  const { id, action, type } = decrypted;

  // make sure type and action are allowed
  if (notificationTypes.indexOf(type) === -1 ||
    notificationActions.indexOf(action) === -1
  ) {
    slackError(102, encrypted);
    return false;
  }

  let success = true;
  const setPreferenceTo = (action === notificationSubscribeAction);
  try {
    // Get Athlete doc from ID and update notification preference
    const athleteDoc = await Athlete.findByIdAndUpdate(id, {
      preferences: {
        notifications: {
          [type]: setPreferenceTo,
        }
      }
    });

    const { preferences } = await Athlete.findById(id, `preferences.notifications`, { lean: true });
    success = preferences.notifications[type] === setPreferenceTo;
  } catch (err) {
    slackError(103, encrypted);
    success = false;
  }

  if (success) {
    slackSuccess('Notification preference updated', decrypted);
  } else {
    slackError(103, decrypted);
  }

  return success;
}

module.exports = handleNotification;
