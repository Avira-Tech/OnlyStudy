const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'system'],
    default: 'text',
  },
  media: [{
    url: String,
    thumbnail: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
  }],
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  // For tip-related messages
  tipAmount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, isRead: 1 });

// Conversation Model (separate to manage conversation metadata)
const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  // Creator-only chat (subscribers only)
  isSubscribersOnly: {
    type: Boolean,
    default: false,
  },
  // Subscription tier required
  requiredTier: {
    type: String,
    enum: ['basic', 'premium', 'vip', null],
    default: null,
  },
}, {
  timestamps: true,
});

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ 'participants': 1 });

// Ensure a conversation has exactly 2 participants
conversationSchema.pre('save', function(next) {
  if (this.isNew && this.participants.length !== 2) {
    return next(new Error('A conversation must have exactly 2 participants'));
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Message, Conversation };

