const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
	_id: Number,
  added_date: String,
  athlete_id: Number,
  laps: Number,
  segment_efforts: Array,
  source: String,
  start_date_local: String,
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
