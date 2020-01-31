const mongoose = require('mongoose');
const { defaultLocation } = require('../config');

const { Schema } = mongoose;

const SegmentEffort = new Schema({
  _id: Number,
  elapsed_time: Number,
  moving_time: Number,
  start_date_local: String,
  startDateUtc: Date,
});

const activitySchema = new Schema({
  _id: Number,
  added_date: String,
  athlete_id: { type: Number, required: true },
  laps: Number,
  segment_efforts: [SegmentEffort],
  source: String,
  start_date_local: String,
  startDateUtc: Date,
  coldLapsPoints: Number,
  location: {
    type: String,
    required: true,
    default: defaultLocation,
    index: true,
  },
  secondaryLocations: [{
    location: String,
    laps: Number,
    segment_efforts: [SegmentEffort],
  }],
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
