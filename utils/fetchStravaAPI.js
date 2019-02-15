const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const { apiUrl } = require('../config');
const { slackError } = require('./slackNotification');
const { getDocFromMaybeToken } = require('./athleteUtils')
const Athlete = require('../schema/Athlete');
const { getAccessToken } = require('./getAccessToken');

/**
 * Fetch data from Strava API, throw error if unsuccessful
 *
 * @param {String} endpoint Path to endpoint
 * @param {String|Document} tokenOrDoc access token or Athlete document
 * @param {Object} params Any optional params
 * @return {Object} Response data
 */
async function fetchStravaAPI(endpoint, tokenOrDoc, params = false) {
  const athleteDoc = await getDocFromMaybeToken(tokenOrDoc);

  const paramsString = params ? `?${stringify(params)}` : '';
  const url = (apiUrl + endpoint + paramsString);

  if (typeof athleteDoc === 'undefined' || !athleteDoc) {
    slackError(44, { url });
    return;
  }

  const access_token = await getAccessToken(athleteDoc);

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
    const athleteId = athleteDoc.get('_id');

    if (401 === response.status) {
      // Set athlete status to deauthorized
      athleteDoc.set('status', 'deauthorized');
      await athleteDoc.save();
      console.log(`Athlete ${athleteId} is deauthorized; updated status`);
    } else {
      // Notify for any other API error
      slackError(45, {
        athleteId,
        url,
        status: response.status,
      });
    }
    throw new Error(`Error fetching ${url} for athlete ${athleteId}`);
    return;
  }

  return await response.json();
}

module.exports = fetchStravaAPI;
