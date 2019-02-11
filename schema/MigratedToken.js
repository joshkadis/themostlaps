const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const migratedTokenSchema = new Schema({
  athlete_id: { type: Number, required: true, unique: true },
  forever_access_token: String,
  migrated_token: {
    access_token: { type: String, required: true, unique: true },
    token_type: { type: String, required: true },
    refresh_token: { type: String, required: true, unique: true },
    expires_at: { type: Number, required: true },
  },
});

const MigratedToken = mongoose.model('MigratedToken', migratedTokenSchema);
module.exports = MigratedToken;
