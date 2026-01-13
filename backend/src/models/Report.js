const mongoose = require('mongoose');

// Report Model for content moderation
const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['post', 'user', 'comment', 'live_stream', 'message'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nudity',
      'copyright',
      'misinformation',
      'scam',
      'underage',
      'other',
    ],
    required: true,
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
  },
  adminNotes: String,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: Date,
  actionTaken: {
    type: String,
    enum: ['content_removed', 'user_warned', 'user_banned', 'no_action', 'other'],
  },
}, {
  timestamps: true,
});

// Indexes
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

// Admin Log for audit trail
const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: [
      'user_ban',
      'user_unban',
      'user_suspend',
      'user_verify',
      'user_role_change',
      'content_remove',
      'content_feature',
      'report_resolve',
      'stream_end',
      'transaction_refund',
      'settings_change',
      'system_config',
    ],
    required: true,
  },
  targetType: {
    type: String,
    enum: ['user', 'post', 'comment', 'live_stream', 'transaction', 'report', 'system'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  ip: String,
  userAgent: String,
  previousState: mongoose.Schema.Types.Mixed,
  newState: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });

const Report = mongoose.model('Report', reportSchema);
const AdminLog = mongoose.model('AdminLog', adminLogSchema);

module.exports = { Report, AdminLog };

