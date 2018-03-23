const crypto = require('crypto');
const algorithm = 'rc4';

function encrypt(input) {
  const cipher = crypto.createCipher(algorithm, input);
  let crypted = cipher.update(input,'utf8', 'hex');
  crypted = crypted + cipher.final('hex');
  return crypted;
}

function decrypt(input) {
  const decipher = crypto.createDecipher(algorithm, input);
  const dec = decipher.update(input ,'hex', 'utf8');
  return dec + decipher.final('utf8');
}

module.exports = {
  encrypt,
  decrypt,
};
