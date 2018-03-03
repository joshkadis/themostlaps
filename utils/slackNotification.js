const fetch = require('isomorphic-unfetch');
const getErrorMessage = require('./internalErrors');

/**
 * Send notification to Slack channel
 * params per https://*.slack.com/services/*?added=1#message_attachments
 *
 * @param {String} fallback
 * @param {String} pretext
 * @param {String} color
 * @param {Array} fields
 *
 */
function sendSlackNotification(fallback, pretext, color, fields) {
  fetch(process.env.SLACK_WEBHOOK, {
    method: 'POST',
    body: JSON.stringify({
      attachments:[
        {
          fallback,
          pretext,
          color,
          fields,
        },
      ],
    }),
  });
}

/**
 * Send error notification to Slack based on error code string
 *
 * @param {Int} errorCode
 * @param {addtlInfo} any Optional extra info
 */
function slackError(errorCode = 0, addtlInfo) {
  const addtlInfoStr = 'undefined' !== typeof addtlInfo && false !== addtlInfo ?
    ` (${JSON.stringify(addtlInfo)})` : '';

  sendSlackNotification(
    `Error ${errorCode}: ${getErrorMessage(errorCode)}${addtlInfoStr}`,
    `Error code ${errorCode}`,
    'danger',
    getFields(getErrorMessage(errorCode), addtlInfo),
  );
}

/**
 * Send success message and maybe details to Slack
 *
 * @param {String} message
 * @param {Any} details Optional
 */
function slackSuccess(message = '', details) {
  if (!message.length) {
    slackError(0, 'Attempted slackSuccess() with empty message');
    return;
  }

  sendSlackNotification(
    `Success: ${message}`,
    `Success!`,
    'good',
    getFields(message, details),
  );
}

/**
 * Get fields array
 *
 * @param {String} primary
 * @param {Any} secondary Optional
 * @return {Array}
 */
function getFields(primary, secondary) {
  const fields = [{
    title: 'Description',
    value: primary,
    short: false,
  }];

  if ('undefined' !== typeof secondary) {
    fields.push({
      title: 'Details',
      value: 'string' === typeof secondary ? secondary : JSON.stringify(secondary),
      short: false,
    })
  }

  return fields;
}

module.exports = {
  slackError,
  slackSuccess,
};
