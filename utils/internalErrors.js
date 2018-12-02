/**
 * Get error message from internal error code
 *
 * @param {Number} code
 * @param {Any} data Optional data to include w error message
 * @return {String}
 */
module.exports = (code = 0, data = '') => {
  switch (code) {
    case 10:
      return `Request error: ${data}`;

    case 20:
    case 30:
    case 40:
      return 'Authentication failed, please try again later 🙅';

    case 45:
      return 'Strava API response status error';

    case 50:
      return 'You only need to sign up once!';

    case 60:
      return 'It looks like you have never ridden laps! 😱';

    case 70:
      return 'Sorry, we couldn\'t find your laps history. 🕵';

    case 80:
      return 'We\'re having troubling saving your laps history, sorry 😞';

    case 90:
      return 'We couldn\'t update your stats, sorry 😞';

    case 100:
      return 'Notifications decryption error';

    case 105:
      return 'Mailchimp subscribe error';

    case 110:
      return 'Webhook payload error';

    case 115:
      return 'Dark Sky API request error';

    case 116:
      return 'Dark Sky API malformed data';

    default:
      return 'An error occurred.';
  }
};
