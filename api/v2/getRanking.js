const _get = require('lodash/get');
const Athlete = require('../../schema/Athlete');
const { isValidLocation } = require('../../utils/v2/locations');

const ATHLETES_PER_PAGE = 15;

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
  if (['allTime', 'single', 'numActivities'].indexOf(primary) !== -1) {
    return primary;
  }
  // Year only
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
    location: reqLocation = 'unspecified',
    page = '1',
    perPage = ATHLETES_PER_PAGE,
  },
) {
  // validate location
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
    : ATHLETES_PER_PAGE;
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
