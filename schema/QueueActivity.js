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
    enum: ['pending', 'shouldIngest', 'error', 'dequeued', 'ingested'],
  },
  errorMsg: {
    type: String,
  },
});

const QueueActivity = model('QueueActivity', queueActivitySchema);

module.exports = QueueActivity;
