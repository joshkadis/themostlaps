const fetch = require('isomorphic-unfetch');
const { stringify } = require('querystring');
const { apiUrl } = require('../config');
const { slackError } = require('./slackNotification');
const Athlete = require('../schema/Athlete');
const { getAccessTokenFromAthleteDoc } = require('./getAccessToken');
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
    access_token = athleteDoc;
  } else {
    access_token = await getAccessTokenFromAthleteDoc(athleteDoc);
  }

  const paramsString = params ? `?${stringify(params)}` : '';
  const url = (apiUrl + endpoint + paramsString);

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
    const athleteDoc = await Athlete.findOne({ access_token });
    if (!athleteDoc) {
      slackError(44, { url });
    }

    const athleteId = athleteDoc ? athleteDoc.get('_id') : 0;

    if (athleteDoc && 401 === response.status) {
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
  }

  return await response.json();
}

module.exports = fetchStravaAPI;
