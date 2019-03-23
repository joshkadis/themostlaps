const { isLocalEnv } = require('../utils/envUtils');
/**
 * Should API request be allowed based on hostname?
 *
 * @param {String} hostname
 * @param {String} queryKey Optional API key
 * @return {Bool}
 */
const validateApiRequest = (hostname, queryKey = null) => {
  let error = '';
  let valid = true;

  // Matching hosts are always ok
  if (hostname === process.env.APP_DOMAIN) {
    return { valid, error };
  }

  // localhost is ok if env var allows
  if (isLocalEnv() && process.env.ALLOW_LOCALHOST !== 'true') {
    error = `Host ${hostname} not allowed to make API requests`;
  } else if (!queryKey || queryKey !== process.env.API_KEY) {
    // other domains may have a API key
    error = 'Missing or invalid API key';
  }

  return {
    false,
    error,
  };
};

module.exports = validateApiRequest;
