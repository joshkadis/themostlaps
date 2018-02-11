const { prodDomain } = require('../config');

/**
 * Should API request be allowed based on hostname?
 *
 * @param {String} hostname
 * @param {String} queryKey Optional API key
 * @return {Bool}
 */
const validateApiRequest = (hostname = null, queryKey = null) => {
  let error = false;

  // Production domain is always ok
  if (hostname === prodDomain) {
    return { error };
  }

  // localhost is ok if env var allows
  if (hostname === 'localhost') {
    if (process.env.ALLOW_LOCALHOST !== 'true') {
      error = `Host ${hostname} not allowed to make API requests`;
    }
    return { error };
  }

  // other domains may have a API key
  if (!queryKey || queryKey !== process.env.API_KEY) {
    error = 'Missing or invalid API key';
  }

  return { error };
};

module.exports = validateApiRequest;
