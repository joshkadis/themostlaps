/**
 * Get error message from internal error code
 *
 * @param {Number} code
 * @param {Any} data Optional data to include w error message
 * @return {String}
 */
module.exports = (code = 0, data = '') => {
  switch (code) {
    case 1:
      return 'Database error';

    case 10:
      return `Request error: ${data}`;

    case 20:
    case 30:
    case 40:
      return 'Authentication failed, please try again later 🙅';

    case 43:
      return 'Failed to clear existing athlete before ingest';

    case 44:
      return 'Attempted API call for unknown athlete';

    case 45:
      return 'Strava API response status error';

    case 46:
      return 'Attempted API call for deauthorized athlete; set status to deauthorized';

    case 50:
      return 'You only need to sign up once!';

    case 60:
      return 'It looks like you have never ridden laps! 😱';

    case 70:
      return 'Sorry, we couldn\'t find your laps history. 🕵';

    case 80:
      return 'We\'re having trouble saving your laps history, sorry 😞';

    case 90:
      return 'We couldn\'t update your stats, sorry 😞';

    case 100:
      return 'Notifications decryption error';

    case 105:
      return 'Mailchimp subscribe error';

    case 110:
      return 'Webhook payload error';

    case 111:
      return 'Activity has no segment efforts';

    case 112:
      return 'QueueActivity creation failed';

    case 114:
      return 'Failed to calculate Cold Laps';

    case 115:
      return 'Dark Sky API request error';

    case 116:
      return 'Dark Sky API malformed data';

    case 120:
      return 'Could not refresh athlete access_token';

    case 130:
      return 'LocationIngest without Athlete document';

    case 131:
      return 'LocationIngest with invalid canonical segment ID';

    default:
      return 'An error occurred.';
  }
};
