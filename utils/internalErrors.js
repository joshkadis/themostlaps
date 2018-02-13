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

    case 50:
      return 'Looks like you\'re already in the database. 🕵';

    case 60:
      return 'Looks like you have never ridden laps! 😱';

    case 70:
      return 'Sorry, we couldn\'t find your laps history. 🕵';

    case 80:
      return 'We\'re having troubling saving your laps history, sorry 😞';

    case 90:
      return 'We couldn\'t update your stats, sorry 😞';

    default:
      return 'An error occurred';
  }
};
