const { model, Schema } = require('mongoose');

const queueActivitySchema = new Schema({
  activityId: {
    type: Number,
    required: true,
    unique: true,
  },
  athleteId: {
    type: Number,
    required: true,
    index: true,
  },
  calculatingFromStream: {
    type: Boolean,
    default: false,
    required: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  enqueuedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  lastAttemptedAt: {
    type: Date,
  },
  ingestAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  numSegmentEfforts: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'shouldIngest', 'error', 'dequeued', 'maxed', 'ingested'],
  },
  errorMsg: {
    type: String,
    alias: 'detail',
  },
});

const QueueActivity = model('QueueActivity', queueActivitySchema);

module.exports = QueueActivity;
