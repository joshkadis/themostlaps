require('isomorphic-fetch');
const fetchAthleteActivities = require('./fetchAthleteActivities');

module.exports = (req, res) => {
  if (req.query.error) {
    res.send(`Error ${req.query.error}`);
    return;
  }

  const body = [
    `client_id=${process.env.CLIENT_ID}`,
    `client_secret=${process.env.CLIENT_SECRET}`,
    `code=${req.query.code}`,
  ].join('&');

  fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    body,
  }).then((response) => {
    return response.status === 200 ? response.json() : false;
  }).then((athlete = false) => {
    if (!athlete || !athlete.access_token) {
      return;
    }
    fetchAthleteActivities(athlete.access_token, res);
  });
};