/**
 * Format athlete stats for rider page
 *
 * @param {Object} stats
 * @return {Object}
 */
function statsForAthletePage(stats) {
  const { allTime, single } = stats;
  let output = {}
  const defaultOutput = {
    allTime: 0,
    single: 0,
    years: [],
    data: {}
  };

  try {
    output = Object.assign(defaultOutput, { allTime, single });
  } catch (err) {
    // if either of those is undefined...
    output = defaultOutput;
  }

  // Add years and months to output
  const data = Object.keys(stats).reduce((acc, key) => {
    // key will be like _2017 or _2017_03
    const matches = /^_(\d{4,4})_?(\d{2,2})?$/.exec(key);
    if (!matches) {
      return acc;
    }

    const year = matches[1];
    const month = matches.length >= 3 ? matches[2] : false;

    acc[year] = Object.assign(
      (acc[year] || {}),
      {[month || 'total']: stats[key]}
    );

    return acc;
  }, {});

  // Ascending order
  const years = Object.keys(data).sort();

  return Object.assign(output, {
    years,
    data,
  });
}

/**
 * Transform rider page stats object for single athlete years chart
 * including any missing years
 *
 * @param {Object} data
 * @param {Array} years
 * @return {Array}
 */
function statsForSingleAthleteYearsChart({ data, years }) {
  const output = [];
  const yearsInts = years.map((year) => parseInt(year, 10));
  const min = yearsInts.shift();
  const max = yearsInts.length > 0 ? yearsInts.pop() : min;

  for (let year = min; year <= max; year++) {
    output.push({
      year,
      value: data[year] ? data[year].total : 0,
    });
  }

  return output;
}

module.exports = {
  statsForAthletePage,
  statsForSingleAthleteYearsChart,
};
