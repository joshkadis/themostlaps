require('isomorphic-fetch');
const { createAthlete } = require('../utils/athleteUtils');
const {
  fetchAthleteHistory,
  saveAthleteHistory,
} = require('../utils/athleteHistory');
const {
  compileStatsForActivities,
  updateAthleteStats,
} = require('../utils/athleteStats');

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
 * Handle post-authorization callback
 */
module.exports = async (req, res) => {
  if (req.query.error) {
    res.send(`Error ${req.query.error}`);
    return;
  }

  if (req.query.state !== 'signup') {
    res.send(`Not sure what you're trying to do, sorry. 🤷‍`);
    return;
  }

  // Authenticate
  let athlete;
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: getTokenRequestBody(req.query.code),
    });

    if (200 !== response.status) {
      console.log(response);
      res.send('Authentication failed, please try again later 🙅');
      return;
    }

    athlete = await response.json();

    if (!athlete || !athlete.access_token) {
      console.log(athlete);
      res.send('Authentication failed, please try again later 🙅');
      return;
    }
  } catch (err) {
    console.log(err);
    res.send('Authentication failed, please try again later 🙅');
    return;
  }

  // Create athlete in database
  let athleteDoc;
  try {
    athleteDoc = await createAthlete(athlete);
    console.log(`Saved ${athleteDoc.get('_id')} to database`);
  } catch (err) {
    console.log(err);
    res.send('Looks like you\'re already in the database? 🕵');
    return;
  }

  // Fetch athlete history
  let athleteHistory;
  try {
    athleteHistory = await fetchAthleteHistory(athleteDoc);
    if (!athleteHistory || !athleteHistory.length) {
      res.send(`Looks like ${athleteDoc.get('athlete.firstname')} ${athleteDoc.get('athlete.lastname')} has never ridden laps! 😱`);
      return;
    }
  } catch (err) {
    console.log(err);
    res.send('Sorry, we couldn\'t find your laps history. 🕵')
    return;
  }

  // Validate and save athlete history
  let savedActivities;
  try {
    savedActivities = await saveAthleteHistory(athleteHistory);
  } catch (err) {
    console.log(err);
    res.send('We couldn\t save your rides history, sorry 😞');
    return;
  }

  // Compile and update stats
  try {
    const stats = compileStatsForActivities(savedActivities);
    const updated = await updateAthleteStats(athleteDoc, stats);
    res.send(`🙌 Here are your stats: ${JSON.stringify(stats)}`)
  } catch (err) {
    console.log(err);
    res.send('We couldn\'t update your stats, sorry 😞');
  }
};