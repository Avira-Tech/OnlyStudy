const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'video', 'mixed'],
    default: 'text',
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video'],
    },
    url: String,
    thumbnail: String,
    publicId: String,
  }],
  isFree: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative'],
    default: 0,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  scheduledAt: {
    type: Date,
    default: null,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'archived'],
    default: 'published',
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  likeCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isReported: {
    type: Boolean,
    default: false,
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Indexes
postSchema.index({ author: 1, status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' });

// Calculate like count before saving
postSchema.pre('save', function(next) {
  this.likeCount = this.likes?.length || 0;
  next();
});

// Virtual for checking if user has unlocked this post
postSchema.methods.isUnlockedBy = function(userId) {
  if (this.isFree || this.author.toString() === userId.toString()) {
    return true;
  }
  return false;
};

// Get preview (locked content preview)
postSchema.methods.getPreview = function() {
  if (this.isFree) {
    return {
      content: this.content,
      media: this.media,
    };
  }

  return {
    content: this.content.substring(0, 100) + '...',
    media: [],
    isLocked: true,
    price: this.price,
  };
};

module.exports = mongoose.model('Post', postSchema);

