const moment = require('moment');
const {
  recentActivities: config,
  defaultLocation,
} = require('../../config');
const { captureSentry } = require('../../utils/v2/services/sentry');
const { isValidLocation } = require('../../utils/v2/locations');
const Activity = require('../../schema/Activity');

/**
 * API response for recent activities
 *
 * @param {Object} query
 */
async function recentActivities(query) {
  let days = query.days || config.days;
  days = parseInt(days, 10);
  const location = (query.location || defaultLocation).toLowerCase();

  // Validate days and location params
  if (Number.isNaN(days) || !isValidLocation(location)) {
    const errorMsg = 'Invalid query param';
    captureSentry(
      errorMsg,
      '/api/v2/recentactivities',
      { extra: query },
    );
    return {
      error: true,
      data: errorMsg,
    };
  }

  // Ok cool, we're validated
  const afterDate = moment()
    .utc()
    .dayOfYear()
    .subtract(days, 'days');
  const activities = await Activity.find({
    startDateUtc: { $gte: afterDate },
    activityLocations: {
      location,
    },
  }).lean();

  // Map activities to API response format
}

module.exports = {
  recentActivities,
};
