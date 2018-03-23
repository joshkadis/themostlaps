const crypto = require('crypto');
const algorithm = 'aes-256-ctr';

function encrypt(input) {
  const cipher = crypto.createCipher(algorithm, input);
  let crypted = cipher.update(input,'utf8', 'hex');
  crypted = crypted + cipher.final('hex');
  return crypted;
}

function decrypt(input) {
  const decipher = crypto.createDecipher(algorithm, input);
  let dec = decipher.update(input ,'hex', 'utf8');
  dec = dec + decipher.final('utf8');
  return dec;
}

module.exports = {
  encrypt,
  decrypt,
};
