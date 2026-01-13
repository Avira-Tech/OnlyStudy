const { Subscription, User, Transaction } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create Stripe customer if not exists
const getOrCreateStripeCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.username,
    metadata: {
      userId: user._id.toString(),
    },
  });

  await User.findByIdAndUpdate(user._id, {
    stripeCustomerId: customer.id,
  });

  return customer.id;
};

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const { creatorId, price, tier } = req.body;
    const userId = req.user.userId;

    const creator = await User.findById(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Check if already subscribed
    const existingSub = await Subscription.findOne({
      subscriber: userId,
      creator: creatorId,
      status: 'active',
    });

    if (existingSub) {
      return res.status(400).json({
        success: false,
        message: 'Already subscribed to this creator',
      });
    }

    const user = await User.findById(userId);
    const customerId = await getOrCreateStripeCustomer(user);

    // Calculate platform fee (20%)
    const platformFee = Math.round(price * 0.20 * 100);
    const amount = Math.round(price * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        userId: userId.toString(),
        creatorId: creatorId.toString(),
        type: 'subscription',
        tier,
        price: price.toString(),
      },
      // Transfer to creator's connected account
      transfer_data: {
        destination: creator.stripeAccountId,
        amount: amount - platformFee,
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        subscription: {
          creatorId,
          tier,
          price,
        },
      },
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message,
    });
  }
};

// Confirm subscription (called after payment)
exports.confirmSubscription = async (req, res) => {
  try {
    const { paymentIntentId, creatorId, tier, price } = req.body;
    const userId = req.user.userId;

    // Get creator's Stripe account
    const creator = await User.findById(creatorId);

    // Create subscription record
    const subscription = await Subscription.create({
      subscriber: userId,
      creator: creatorId,
      tier,
      price,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      stripeSubscriptionId: paymentIntentId,
      autoRenew: true,
    });

    // Create transaction
    await Transaction.create({
      user: userId,
      type: 'subscription',
      amount: price,
      status: 'completed',
      relatedUser: creatorId,
      relatedSubscription: subscription._id,
      platformFee: price * 0.20,
      creatorEarnings: price * 0.80,
    });

    // Notify creator
    const { Notification } = require('../models');
    await Notification.createNotification({
      recipient: creatorId,
      sender: userId,
      type: 'new_subscriber',
      title: 'New Subscriber',
      message: `${(await User.findById(userId)).username} subscribed to your ${tier} tier`,
      data: { subscriptionId: subscription._id },
    });

    res.json({
      success: true,
      message: 'Subscription confirmed',
      data: { subscription },
    });
  } catch (error) {
    console.error('Confirm subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm subscription',
    });
  }
};

// Get user's subscriptions
exports.getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'active', page = 1, limit = 10 } = req.query;

    const query = { subscriber: userId };
    if (status !== 'all') {
      query.status = status;
    }

    const subscriptions = await Subscription.find(query)
      .populate('creator', 'username avatar bio isCreatorVerified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
    });
  }
};

// Get creator's subscribers
exports.getSubscribers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'active', page = 1, limit = 10 } = req.query;

    const query = { creator: userId };
    if (status !== 'all') {
      query.status = status;
    }

    const subscriptions = await Subscription.find(query)
      .populate('subscriber', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      data: {
        subscribers: subscriptions,
        total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscribers',
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.userId;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    if (subscription.subscriber.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled',
      data: { subscription },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
    });
  }
};

// Check subscription status
exports.checkSubscription = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({
      subscriber: userId,
      creator: creatorId,
      status: 'active',
    });

    res.json({
      success: true,
      data: {
        isSubscribed: !!subscription,
        subscription,
      },
    });
  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check subscription',
    });
  }
};

// Get creator stats
exports.getCreatorStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const totalSubscribers = await Subscription.countDocuments({
      creator: userId,
      status: 'active',
    });

    const monthlyEarnings = await Transaction.aggregate([
      {
        $match: {
          relatedUser: userId,
          type: { $in: ['subscription', 'tip', 'pay_per_view'] },
          status: 'completed',
          createdAt: {
            $gte: new Date(new Date().setDate(1)), // Start of month
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$creatorEarnings' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalSubscribers,
        monthlyEarnings: monthlyEarnings[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get creator stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
    });
  }
};

