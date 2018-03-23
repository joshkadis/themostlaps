const { decrypt } = require('../utils/encryption');

/**
 * Handle notification route
 *
 * @param {String} cipher
 * @param {Response} res
 */
function handleNotification(cipher, res) {
  const input = decrypt(cipher);
  console.log(cipher, input);
  res.send(input);
}

module.exports = handleNotification;
