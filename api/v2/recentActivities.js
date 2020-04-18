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
  const location = (query.location || defaultLocation).toLowerCase();
  const days = parseInt((query.days || config.days), 10);
  const limit = parseInt((query.perPage || config.perPage), 10);
  let skip = parseInt((query.page || 1), 10);

  // Validate days and location params
  if (
    Number.isNaN(days)
    || Number.isNaN(limit)
    || Number.isNaN(skip)
    || !isValidLocation(location)
  ) {
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
  skip = (skip - 1) * limit;

  // Ok cool, we're validated
  const afterDate = moment()
    .utc()
    .subtract(days, 'days')
    .format('YYYY-MM-DD');

  const activities = await Activity.find(
    {
      startDateUtc: { $gte: new Date(afterDate) },
      activityLocations: { $elemMatch: { location } },
    },
    '_id athlete_id',
    {
      limit,
      skip,
      sort: { startDateUtc: -1 },
    },
  ).lean();

  return {
    error: false,
    data: activities,
  };
  // Map activities to API response format
}

module.exports = {
  recentActivities,
};
