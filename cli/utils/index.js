const { confirm } = require('promptly');

/**
 * Get UTC timestamp in *seconds* minus a number of days
 *
 * @param {Int} daysago
 * @return {Int}
 */
function daysAgoTimestamp(daysago = null) {
  const current = Math.floor(Date.now() / 1000);

  const days = parseInt(daysago, 10);

  if (!daysago || Number.isNaN(days)) {
    return current;
  }

  return current - (days * 86400); // Seconds in a day
}

/**
 * Check for expected number of args
 * Note that args[0] will be name of subcommand
 * args[1]... will be the actual arguments
 *
 * @param {Array} args.length Number of args received
 * @param {Integer} num Expected number of args
 * @param {String} warning Text for warning if wrong number of args
 * @return {Bool}
 */
function makeCheckNumArgs(baseWarning) {
  return ({ length }, num, warning) => {
    if (length === num) {
      return true;
    }
    if (length > num) {
      console.warn('Too many arguments');
    } else if (length < num) {
      console.warn('Missing arguments');
    }
    console.warn(`${baseWarning} ${warning}`);
    return false;
  };
}

/**
 * Require confirmation before proceeding with command
 *
 * @param {Function} callback
 * @param {String} message Optional message
 */
async function withPrompt(callback, message = '') {
  const res = await confirm(
    `${message} Do you want to continue? [y/n]`,
  );
  if (!res) {
    return;
  }
  callback();
}

module.exports = {
  withPrompt,
  daysAgoTimestamp,
  makeCheckNumArgs,
};
