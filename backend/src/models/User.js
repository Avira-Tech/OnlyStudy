const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'creator', 'admin'],
    default: 'student',
  },
  avatar: {
    type: String,
    default: '/uploads/avatars/default.png',
  },
  banner: {
    type: String,
    default: '/uploads/banners/default.png',
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  isCreatorVerified: {
    type: Boolean,
    default: false,
  },
  stripeAccountId: {
    type: String,
    default: null,
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  socialLinks: {
    website: String,
    twitter: String,
    instagram: String,
    youtube: String,
  },
  subscriptionTiers: [{
    name: {
      type: String,
      enum: ['basic', 'premium', 'vip'],
      default: 'basic',
    },
    price: {
      type: Number,
      default: 4.99,
    },
    description: String,
    benefits: [String],
  }],
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for search
userSchema.index({ username: 'text', bio: 'text' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Get public profile data
userSchema.methods.toPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    avatar: this.avatar,
    banner: this.banner,
    bio: this.bio,
    isVerified: this.isCreatorVerified,
    socialLinks: this.socialLinks,
    createdAt: this.createdAt,
  };
};

// Get creator stats (virtual)
userSchema.virtual('subscriberCount').get(function() {
  return this.subscribers?.length || 0;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

