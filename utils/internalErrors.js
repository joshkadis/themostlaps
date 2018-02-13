/**
 * Get error message from internal error code
 *
 * @param {Number} code
 * @param {Any} data Optional data to include w error message
 * @return {String}
 */
export default (code = 0, data = '') => {
  switch (code) {
    case 1:
      return `Request error: ${data}`;

    case 2:
    case 3:
    case 4:
      return 'Authentication failed, please try again later 🙅';

    case 5:
      return 'Looks like you\'re already in the database? 🕵';

    case 6:
      return 'Looks like you have never ridden laps! 😱';

    case 7:
      return 'Sorry, we couldn\'t find your laps history. 🕵';

    case 8:
      return 'We\'re having troubling saving your laps history, sorry 😞';

    case 9:
      return 'We couldn\'t update your stats, sorry 😞';

    default:
      return 'An error occurred';
  }
};
