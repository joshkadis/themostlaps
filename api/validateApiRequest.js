const { prodDomain } = require('../config');

module.exports = (hostname = null, queryKey = null) => {
  if ((hostname === 'localhost' && process.env.ALLOW_LOCALHOST !== 'true') ||
    (hostname !== prodDomain && hostname !== 'localhost')
  ) {
    return { error: `Host ${hostname} not allowed to make API requests` };
  }

  if (!queryKey || queryKey !== process.env.API_KEY) {
    return { error: 'Missing or invalid API key' };
  }

  return { error: false };
};
