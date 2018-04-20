const getInternalErrorMessage = require('../internalErrors');

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

module.exports = {
  getErrorResponseObject,
};
