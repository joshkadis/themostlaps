const mongoose = require('mongoose');
const Mixed = mongoose.Schema.Types.Mixed;
const Schema = mongoose.Schema;

const MigratedToken = new Schema({
  access_token: { type: String, required: true, unique: true },
  token_type: { type: String, required: true },
  forever_access_token: String,
  refresh_token: String,
  expires_at: Number,
});

const athleteSchema = new Schema({
  _id: Number,
  access_token: { type: String, required: true, unique: true },
  token_type: { type: String, required: true },
  migrated_token: MigratedToken,
  athlete: {
    firstname: String,
    lastname: String,
    profile: String,
    email: String,
    id: { type: Number, required: true },
  },
  status: { type: String, required: true, default: 'ingesting' },
  last_updated: { type: String, required: true },
  created: { type: String, required: true },
  last_refreshed: { type: Number, required: true },
  stats: { type: Mixed, required: true, default: {} },
  preferences: {
    notifications: {
      monthly: { type: Boolean, default: true },
    },
  },
});

const Athlete = mongoose.model('Athlete', athleteSchema);

module.exports = Athlete;
