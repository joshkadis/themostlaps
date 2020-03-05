const _get = require('lodash/get');
const Athlete = require('../../schema/Athlete');
const { isValidLocation } = require('../../utils/v2/locations');
const { rankingPerPage } = require('../apiConfig');

function formatAthleteForRanking(athlete, reqType, reqLocation) {
  const {
    athlete: {
      firstname,
      lastname,
      profile,
    },
    stats,
    status,
    _id,
  } = athlete;

  return {
    _id,
    id: Number(_id),
    athlete: {
      firstname,
      lastname,
      profile,
    },
    status,
    stats: {
      [reqType]: _get(stats, `locations.${reqLocation}.${reqType}`),
    },
  };
}

function getReqType(primary, secondary = '') {
  // Top-level request
  if (['alltime', 'single', 'numactivities'].indexOf(primary.toLowerCase()) !== -1) {
    // @hack! We want the `?location` param in the API url to be case-insensitive
    // but we need to convert to a DB field that _is_ case-sensitive
    switch (primary.toLowerCase()) {
      case 'single':
        return 'single';

      case 'numactivities':
        return 'numActivities';

      default: // Can only be 'alltime' in the if statement above
        return 'allTime';
    }
  }
  // Year only
  // @todo Validate years and months within acceptable ranges
  //  i.e. don't allow /2043/22
  if (/20\d{2}/.test(primary)) {
    if (!secondary) {
      return `byYear.${primary}`;
    }
    // Year and month
    if (/\d{2}/.test(secondary)) {
      const monthIdx = Number(secondary) - 1;
      return `byMonth.${primary}.${monthIdx}`;
    }
  }
  // Invalid request
  return false;
}

async function getRanking(
  {
    reqPrimary,
    reqSecondary = '',
  },
  {
    location = 'unspecified',
    page = '1',
    perPage = rankingPerPage,
  },
) {
  // validate location
  const reqLocation = location.toLowerCase();
  if (!reqLocation || !isValidLocation(reqLocation)) {
    return {
      error: true,
      data: `Invalid location: ${reqLocation}`,
    };
  }

  const reqType = getReqType(reqPrimary, reqSecondary);

  const locQueryKey = `stats.locations.${reqLocation}.${reqType}`;

  // @todo Return error for invalid param or just set to default?
  const limit = /\d+/.test(perPage.toString())
    ? Number(perPage)
    : rankingPerPage;
  const skip = /\d+/.test(page.toString())
    ? limit * (Number(page) - 1)
    : 0;

  const rankedAthletes = await Athlete.find(
    {
      [locQueryKey]: { $gt: 0 },
      status: 'ready',
    },
    null,
    {
      lean: true,
      limit,
      skip,
      sort: { [locQueryKey]: -1 },
    },
  );

  const ranking = rankedAthletes.map(
    (athlete) => formatAthleteForRanking(athlete, reqType, reqLocation),
  );

  return {
    error: false,
    data: {
      statsKey: reqType,
      ranking,
    },
  };
}

module.exports = {
  getRanking,
};
