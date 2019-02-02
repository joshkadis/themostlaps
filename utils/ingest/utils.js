import { stringify } from 'query-string';
import { authRequestParams } from '../../config';
const getInternalErrorMessage = require('../internalErrors');
import { getEnvOrigin } from '..envUtils';

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

  return 'https://www.strava.com/oauth/authorize?' + stringify(params);
}

module.exports = {
  getErrorResponseObject,
  getStravaAuthRequestUrl,
};
