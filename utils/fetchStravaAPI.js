const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const { apiUrl } = require('../config');
const { slackError } = require('./slackNotification');
const Athlete = require('../schema/Athlete');

/**
 * Fetch data from Strava API
 *
 * @param {String} endpoint Path to endpoint
 * @param {String} access_token Athlete access token
 * @param {Object} params Any optional params
 * @return {Object} Response data or null if error
 */
async function fetchStravaAPI(endpoint, access_token, params = false) {
  const paramsString = params ? `?${stringify(params)}` : '';
  const url = (apiUrl + endpoint + paramsString);

  const response = await fetch(
    url,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    }
  );

  if (200 !== response.status) {
    const athleteDoc = await Athlete.findOne({ access_token });
    const athleteId = athleteDoc ? athleteDoc.get('_id') : 0;
    slackError(45, {
      athleteId,
      url,
      status: response.status,
    });
    throw new Error(`Error fetching ${url} for athlete ${athleteId}`);
  }

  return await response.json();
}

module.exports = fetchStravaAPI;
