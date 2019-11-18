const Athlete = require('../schema/Athlete');

/**
 * Get data for site totals API request
 *
 * @return {Object} Stats object, except for 'single'
 */
async function getTotals() {
  // Include deauthorzed athletes in aggregate totals
  const athletes = await Athlete.find({}, 'stats');

  const data = athletes.reduce((acc, { stats }) => {
    Object.keys(stats).forEach((key) => {
      if (key !== 'single') {
        acc[key] = (acc[key] || 0) + stats[key];
      }
    });
    return acc;
  }, {});

  return {
    error: false,
    data,
  };
}

module.exports = getTotals;
