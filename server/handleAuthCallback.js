require('isomorphic-fetch');
const Athlete = require('./schema/athlete');
const Activity = require('./schema/activity');
const fetchAthleteActivities = require('../utils/fetchAthleteActivities');
const fetchLapsFromActivities = require('../utils/fetchLapsFromActivities');

function _saveActivityIfNotExists(activityModel, activityId) {
  // Do not overwrite activities we already know about because
  // the segment data cannot be changed
  Activity.findById(activityId, (err, found) => {
    if (found) {
      console.log(`Already saved activity ${activityId}`)
    } else {
      activityModel.save((err) => {
        if (err) {
          console.warn(`Failed to save activity ${activityId}`);
        } else {
          console.log(`Saved activity ${activityId}`);
        }
      });
    }
  });
}

function _fetchAndSaveActivities(athlete, res) {
  fetchAthleteActivities(athlete.access_token, res)
    .then((activityIds) => fetchLapsFromActivities(activityIds, athlete.access_token))
    .then((activities) => {
      activities.forEach((activity) => {
        const activityModel = new Activity(activity);
        activityModel.validate((err) => {
          if (err) {
            console.warn(`Failed to validate activity ${activity._id}`);
            console.log(activity);
          } else {
            _saveActivityIfNotExists(activityModel, activity._id);
          }
        });
      });
    });
}

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
      // @todo Handle error
      res.send('could not find athlete');
      return;
    }

    // Overwrite athlete data if it exists because
    // people change their names, etc.
    Athlete.findByIdAndUpdate(
      athlete.athlete.id,
      {
        _id: athlete.athlete.id,
        status: 'ingesting',
        ...athlete,
      },
      { upsert: true },
      (err) => {
        if (err) throw err;
        console.log(`Saved ${athlete.athlete.id} to database`);
        res.send(`Importing laps for ${athlete.athlete.firstname} ${athlete.athlete.lastname}. This will take a few minutes.`);
        _fetchAndSaveActivities(athlete, res);
      }
    );
  });
};