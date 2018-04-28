/**
 * Determine from callback state param whether to subscribe to newsletter
 *
 * @param {Object} query From req.query
 * @return {Bool}
 */
function shouldSubscribeFromCallback({ state = false }) {
  if (!state || 'string' !== typeof state) {
    return false;
  }

  const stateParam = decodeURIComponent(state).split('|');
  return stateParam.length > 1 && stateParam[1] === 'shouldSubscribe';
}

module.exports = shouldSubscribeFromCallback;
