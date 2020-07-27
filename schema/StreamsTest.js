const mongoose = require('mongoose');

const { model, Schema } = mongoose;

// DarkSky Data Point schema
// https://darksky.net/dev/docs#data-point
const streamsTestSchema = new Schema({
  activityId: Number,
  numSegmentEfforts: [Number],
  numStreamDataPoints: [Number],
});

const StreamTest = model('StreamTest', streamsTestSchema);

module.exports = StreamTest;
