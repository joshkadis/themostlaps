const mongoose = require('mongoose');
const Mixed = mongoose.Schema.Types.Mixed;
const Schema = mongoose.Schema;

const athleteSchema = new Schema({
  _id: Number,
  access_token: { type: String, required: true, unique: true },
  token_type: String,
  athlete: Mixed,
  status: String,
  last_updated: String,
  stats: Mixed,
});

const Athlete = mongoose.model('Athlete', athleteSchema);

module.exports = Athlete;
