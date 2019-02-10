const { stringify } = require('query-string');
const { authRequestParams, stravaOauthUrl } = require('../../config');
const getInternalErrorMessage = require('../internalErrors');
const { getEnvOrigin } = require('../envUtils');

/**
 * Get response object for error code
 *
 * @param {Number} code
 * @param {Any} errData Optional error data
 * @param {Object} athlete Optional athlete data if we have it
 * @return {Object}
 */
function getErrorResponseObject(code, errData = null, athlete = false) {
  return {
    errorCode: code,
    errorMsg: getInternalErrorMessage(code, errData),
    athlete,
  }
}

function getStravaAuthRequestUrl(pathname = '/', shouldSubscribe = false) {
  const params = Object.assign({}, authRequestParams, {
    redirect_uri: getEnvOrigin() + '/auth-callback',
    state: pathname + (shouldSubscribe ? '|shouldSubscribe' : ''),
  });

  return `${stravaOauthUrl}/authorize?${stringify(params)}`;
}

module.exports = {
  getErrorResponseObject,
  getStravaAuthRequestUrl,
};
