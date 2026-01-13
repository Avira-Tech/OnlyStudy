const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: [
      'new_subscriber',
      'new_follower',
      'post_published',
      'post_liked',
      'post_commented',
      'tip_received',
      'new_subscriber_tip',
      'live_stream_started',
      'live_stream_ended',
      'new_message',
      'subscription_renewed',
      'subscription_cancelled',
      'subscription_expired',
      'payout_completed',
      'account_suspended',
      'account_reinstated',
      'content_reported',
      'system_announcement',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  link: String,
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  // For in-app and push notifications
  channels: {
    inApp: {
      type: Boolean,
      default: true,
    },
    email: {
      type: Boolean,
      default: false,
    },
    push: {
      type: Boolean,
      default: false,
    },
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  expiresAt: Date,
}, {
  timestamps: true,
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

// Mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

module.exports = mongoose.model('Notification', notificationSchema);

