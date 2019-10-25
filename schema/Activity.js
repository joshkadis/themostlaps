const mongoose = require('mongoose');

const { Schema } = mongoose;

const SegmentEffort = new Schema({
  _id: Number,
  elapsed_time: Number,
  moving_time: Number,
  start_date_local: String,
});

const activitySchema = new Schema({
  _id: Number,
  added_date: String,
  athlete_id: Number,
  laps: Number,
  segment_efforts: [SegmentEffort],
  source: String,
  start_date_local: String,
  coldLapsPoints: Number,
  location: String,
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
