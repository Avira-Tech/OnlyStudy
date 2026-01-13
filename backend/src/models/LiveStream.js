const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema({
  streamer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'live',
  },
  // Access control
  accessType: {
    type: String,
    enum: ['free', 'subscribers', 'paid'],
    default: 'subscribers',
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0,
  },
  // Stream details
  streamKey: {
    type: String,
    unique: true,
  },
  rtmpUrl: {
    type: String,
    default: '',
  },
  playbackUrl: {
    type: String,
    default: '',
  },
  // Scheduling
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  // Engagement metrics
  peakViewers: {
    type: Number,
    default: 0,
  },
  totalViewers: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
  tips: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: Number,
    message: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  totalTips: {
    type: Number,
    default: 0,
  },
  // Chat
  chatEnabled: {
    type: Boolean,
    default: true,
  },
  chatMessages: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Moderation
  isReported: {
    type: Boolean,
    default: false,
  },
  reportReason: String,
  // Recording (optional)
  recordingUrl: String,
  thumbnail: String,
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Indexes
liveStreamSchema.index({ streamer: 1, status: 1, createdAt: -1 });
liveStreamSchema.index({ status: 1, createdAt: -1 });
liveStreamSchema.index({ tags: 1 });
liveStreamSchema.index({ streamKey: 1 });

// Generate stream key before saving
liveStreamSchema.pre('save', function(next) {
  if (!this.streamKey) {
    this.streamKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Virtual for checking if stream is active
liveStreamSchema.virtual('isLive').get(function() {
  return this.status === 'live';
});

module.exports = mongoose.model('LiveStream', liveStreamSchema);

