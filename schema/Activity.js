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

const ActivityLocation = new Schema(
  {
    location: { type: String, required: true },
    laps: { type: Number, required: true },
    segment_efforts: [SegmentEffort],
  },
  {
    _id: false,
  },
);

const activitySchema = new Schema({
  _id: Number,
  added_date: String,
  athlete_id: { type: Number, required: true },
  laps: { type: Number, required: true },
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
  activityLocations: [ActivityLocation],
  app_version: String, // 'v1' if created before Apr 2020 migration
  migration: {
    location: Boolean,
  },
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
