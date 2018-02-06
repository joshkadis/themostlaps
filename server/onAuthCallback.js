require('isomorphic-fetch');
const Athlete = require('./schema/athlete');
const Activity = require('./schema/activity');
const fetchAthleteActivities = require('../utils/fetchAthleteActivities');
const fetchLapsFromActivities = require('../utils/fetchLapsFromActivities');

/**
 * Get query string for token request with oAuth code
 *
 * @param {String} code
 * @return {String}
 */
function getTokenRequestBody(code) {
  return [
    `client_id=${process.env.CLIENT_ID}`,
    `client_secret=${process.env.CLIENT_SECRET}`,
    `code=${code}`,
  ].join('&');
}

/**
 * Convert API response for ahlete to our model's format
 *
 * @param {Object} athlete
 * @return {Object}
 */
function getAthleteModelFormat(athlete) {
  const lastUpdated = new Date();
  return {
    _id: athlete.athlete.id,
    status: 'ingesting',
    last_updated: lastUpdated.toISOString(),
    ...athlete,
  };
}

/**
 * Handle post-authorization callback
 */
module.exports = async (req, res) => {
  if (req.query.error) {
    res.send(`Error ${req.query.error}`);
    return;
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: getTokenRequestBody(req.query.code),
    });

    if (200 !== response.status) {
      res.send('could not fetch token for athlete');
      return;
    }

    const athlete = await response.json();

    if (!athlete || !athlete.access_token) {
      res.send('could not parse athlete token response');
      return;
    }

    const lastUpdated = new Date();
    const athleteDoc = await Athlete.findByIdAndUpdate(
      athlete.athlete.id,
      getAthleteModelFormat(athlete),
      { upsert: true }
    );

    if (!athleteDoc) {
      res.send('Failed to update athlete in database, sorry 😞');
      return;
    }

    console.log(`Saved ${athleteDoc.get('_id')} to database`);
    res.send(`Importing laps for ${athleteDoc.get('athlete.firstname')} ${athleteDoc.get('athlete.lastname')}. This will take a few minutes.`);
  } catch (err) {
    console.log(err);
    res.send('An error occurred, sorry 😞');
  }
};