const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MigratedToken = new Schema({
  athlete_id: { type: Number, required: true, unique: true },
  forever_access_token: { type: String, required: true, unique: true },
  migrated_token: {
    access_token: { type: String, required: true, unique: true },
    token_type: { type: String, required: true },
    refresh_token: { type: String, required: true, unique: true },
    expires_at: { type: Number, required: true },
  },
});
