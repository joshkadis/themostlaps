const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const { apiUrl } = require('../config');
const Athlete = require('../schema/Athlete');
const { getUpdatedAccessToken } = require('./getUpdatedAccessToken');
const { captureSentry } = require('./v2/services/sentry');

/**
 * Fetch data from Strava API, throw error if unsuccessful
 * @note Use new token refresh logic
 * @param {String} endpoint Path to endpoint
 * @param {Document|String} athleteDoc Athlete document or fallback to forever token string
 * @param {Object} params Any optional params
 * @return {Object} Response data
 */
async function fetchStravaAPI(endpoint, athleteDoc, params = false) {
  let access_token;

  if (typeof athleteDoc === 'string') {
    // If access_token is passed directly instead of Athlete document
    access_token = athleteDoc;
  } else {
    // Get access_token using `forever token` or new auth logic
    const shouldMigrateOnFetch = process.env.SHOULD_MIGRATE_ON_FETCH;
    access_token = await getUpdatedAccessToken(
      athleteDoc,
      shouldMigrateOnFetch,
    );
    if (!access_token) {
      return {};
    }
  }

  const paramsString = params ? `?${stringify(params)}` : '';
  const prependEndpoint = endpoint.indexOf('/') === 0 ? '' : '/';
  const url = `${apiUrl}${prependEndpoint}${endpoint}${paramsString}`;

  // @todo Should catch error here
  // but it's been stable up to this point...
  const response = await fetch(
    url,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  );

  if (response.status && response.status !== 200) {
    let attemptedAthleteId = null;
    let attemptedAthleteDoc = false;

    if (typeof athleteDoc !== 'string') {
      attemptedAthleteId = athleteDoc.get('_id');
      attemptedAthleteDoc = athleteDoc;
    } else {
      // If string was passed as athleteDoc param,
      // make sure it refers to a known athlete in database
      attemptedAthleteDoc = await Athlete.findOne({ access_token });
      if (!attemptedAthleteDoc) {
        captureSentry(
          'Attempted API call for unknown athlete',
          'fetchStravaAPI',
          {
            level: 'warning',
            extra: { url },
          },
        );
        return {};
      }
      attemptedAthleteId = attemptedAthleteDoc.get('_id');
    }

    if (attemptedAthleteDoc && attemptedAthleteId && response.status === 401) {
      // Set athlete status to deauthorized
      attemptedAthleteDoc.set('status', 'deauthorized');
      await attemptedAthleteDoc.save();

      captureSentry(
        'Attempted API call for deauthorized athlete',
        'fetchStravaAPI',
        {
          level: 'warning',
          extra: { url, athleteId: attemptedAthleteId },
        },
      );
    } else {
      // Notify for any other API error
      captureSentry(
        'Strava API response error',
        'fetchStravaAPI',
        {
          level: 'warning',
          extra: {
            url,
            athleteId: attemptedAthleteId,
            status: response.status,
          },
        },
      );
    }
    return response;
  }

  return response.json();
}

module.exports = fetchStravaAPI;
