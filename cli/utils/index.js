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
 * @param {Array} args
 * @param {Integer} num Expected number of args
 * @param {String} warning Text for warning if wrong number of args
 * @return {Bool}
 */
function checkNumArgs(args, num, warning) {
  if (args.length !== num) {
    console.warn(`Use format: $ activity queue ${warning}`);
    return false;
  }
  return true;
}


module.exports = {
  daysAgoTimestamp,
  checkNumArgs,
};
