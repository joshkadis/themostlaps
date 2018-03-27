const Cryptr = require('cryptr');

function encrypt(input, secret = process.env.NOTIFICATIONS_KEY) {
  const cryptr = new Cryptr(secret);
  return cryptr.encrypt(input);
}

function decrypt(input, secret = process.env.NOTIFICATIONS_KEY) {
  const cryptr = new Cryptr(secret);
  return cryptr.decrypt(input);
}

module.exports = {
  encrypt,
  decrypt,
};
