const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const { apiUrl } = require('../config');
const { slackError } = require('./slackNotification');
const Athlete = require('../schema/Athlete');
const { getUpdatedAccessToken } = require('./getUpdatedAccessToken');
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
    access_token = await getUpdatedAccessToken(athleteDoc);
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
      }
    }
  );

  if (200 !== response.status) {
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
        slackError(44, { url });
        return;
      } else {
        attemptedAthleteId = attemptedAthleteDoc.get('_id');
      }
    }

    if (attemptedAthleteDoc && attemptedAthleteId && 401 === response.status) {
      // Set athlete status to deauthorized
      attemptedAthleteDoc.set('status', 'deauthorized');
      await attemptedAthleteDoc.save();

      slackError(46, { attemptedAthleteId, url });
      console.log(`Athlete ${attemptedAthleteId} is deauthorized; updated status`);
    } else {
      // Notify for any other API error
      slackError(45, {
        attemptedAthleteId,
        url,
        status: response.status,
      });
    }
    throw new Error(`Error fetching ${url} for athlete ${attemptedAthleteId}`);
    return response;
  }

  return await response.json();
}

module.exports = fetchStravaAPI;
