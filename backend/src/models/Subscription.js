const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tier: {
    type: String,
    enum: ['basic', 'premium', 'vip'],
    default: 'basic',
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  currency: {
    type: String,
    default: 'usd',
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'paused'],
    default: 'active',
  },
  stripeSubscriptionId: String,
  stripePriceId: String,
  currentPeriodStart: {
    type: Date,
    default: Date.now,
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
  },
  cancelledAt: Date,
  autoRenew: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index for unique subscriptions
subscriptionSchema.index({ subscriber: 1, creator: 1, status: 1 });
subscriptionSchema.index({ creator: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

// Check if subscription is valid
subscriptionSchema.methods.isValid = function() {
  return this.status === 'active' && new Date() < this.currentPeriodEnd;
};

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.currentPeriodEnd);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

