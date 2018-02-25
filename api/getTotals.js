const Athlete = require('../schema/Athlete');

/**
 * Get data for site totals API request
 *
 * @return {Object} Stats object, except for 'single'
 */
async function getTotals() {
  const athletes = await Athlete.find({}, 'stats');

  const data = athletes.reduce((acc, { stats }) => {
    Object.keys(stats).forEach((key) => {
      if ('single' !== key) {
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
