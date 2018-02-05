const mongoose = require('mongoose')
const assert = require('assert');
const Athlete = require('./schema/athlete');

// Mock ingested data from Strava API
const athlete = require('../dev/data/athlete');
const athleteLaps = require('../dev/data/athleteLaps');

module.exports = (req, res) => {
  console.log('connecting to db');
  mongoose.connect(process.env.DB_URL);

  const athleteModel = new Athlete({
    token: athlete.access_token,
    id: athlete.athlete.id,
    firstname: athlete.athlete.firstname,
    lastname: athlete.athlete.lastname,
    activities: athleteLaps,
  });

  athleteModel.save((err) => {
    if (err) throw err;
    console.log('saved athlete to db');
  });
};
