const Athlete = require('../schema/Athlete');

/**
 * Compile stats for an array of activity documents
 *
 * @param {Array} activities Array of Activity documents
 * @param {Object} initial Optional initial stats value
 * @return {Object}
 */
function compileStatsForActivities(
  activities,
  initial = {
    allTime: 0,
    single: 0,
  },
) {
  return activities.reduce((acc, activity) => {
    // Increment allTime total
    acc.allTime = acc.allTime + activity.get('laps');

    // Increment year and month allTimes
    const matches = /^(\d{4,4})-(\d{2,2})-/.exec(activity.get('start_date_local'));
    if (matches) {
      const yearKey = `_${matches[1]}`;
      const monthKey = `${yearKey}_${matches[2]}`;
      acc[yearKey] = (acc[yearKey] || 0) + activity.get('laps');
      acc[monthKey] = (acc[monthKey] || 0) + activity.get('laps');
    }

    // Most laps in a single ride?
    if (activity.get('laps') > acc.single) {
      acc.single = activity.get('laps');
    }

    return acc;
  }, initial);
}

/**
 * Update an athletes stats with new rides
 *
 * @param {Document} athleteDoc
 * @param {String} status Defaults to 'ready'
 * @param {Object} stats
 */
async function updateAthleteStats(athleteDoc, stats, status = 'ready') {
  const currentDate = new Date();
  return await Athlete.findByIdAndUpdate(
    athleteDoc.get('_id'),
    {
      last_updated: currentDate.toISOString(),
      stats,
      status,
    },
    { new: true }
  );
};

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

  // Descending order
  const years = Object.keys(data).sort().reverse();

  return Object.assign(output, {
    years,
    data,
  });
}

module.exports = {
  compileStatsForActivities,
  updateAthleteStats,
  statsForAthletePage,
};
