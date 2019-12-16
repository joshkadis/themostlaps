const { model, Schema } = require('mongoose');

const queueActivitySchema = new Schema({
  activityId: {
    type: Number,
    required: true,
    index: true,
  },
  athleteId: {
    type: Number,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  enqueuedAt: {
    type: Date,
    default: Date.now,
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
    default: 'ready',
    enum: ['ready', 'error', 'dequeued'],
  },
  errorCode: {
    type: Number,
  },
});

const QueueActivity = model('QueueActivity', queueActivitySchema);

module.exports = QueueActivity;
