/**
 * Get UTC timestamp in *seconds* minus a number of days
 *
 * @param {Int} daysago
 * @return {Int}
 */
function daysAgoTimestamp(daysago = null) {
  const current = Math.floor(Date.now() / 1000);

  const days = parseInt(daysago, 10);

  if (!daysago || isNaN(days)) {
    return current;
  }

  return current - (days * 86400); // Seconds in a day
}

module.exports = {
  daysAgoTimestamp,
};
