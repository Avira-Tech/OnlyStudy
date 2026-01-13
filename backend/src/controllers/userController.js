const { User, Subscription, Post } = require('../models');

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, bio, socialLinks } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (username !== undefined) {
      // Check if username is taken
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (socialLinks !== undefined) {
      user.socialLinks = { ...user.socialLinks, ...socialLinks };
    }

    // Handle file uploads
    if (req.files?.avatar) {
      user.avatar = `/uploads/avatars/${req.files.avatar[0].filename}`;
    }
    if (req.files?.banner) {
      user.banner = `/uploads/banners/${req.files.banner[0].filename}`;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toPublicProfile() },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// Update pricing settings
exports.updatePricing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { basicPrice, premiumPrice, vipPrice, allowTips, allowPPV } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (basicPrice !== undefined) user.pricing = { ...user.pricing, basic: basicPrice };
    if (premiumPrice !== undefined) user.pricing = { ...user.pricing, premium: premiumPrice };
    if (vipPrice !== undefined) user.pricing = { ...user.pricing, vip: vipPrice };
    if (allowTips !== undefined) user.allowTips = allowTips;
    if (allowPPV !== undefined) user.allowPPV = allowPPV;

    await user.save();

    res.json({
      success: true,
      message: 'Pricing updated successfully',
      data: { 
        pricing: user.pricing,
        allowTips: user.allowTips,
        allowPPV: user.allowPPV,
      },
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing',
    });
  }
};

// Update notification settings
exports.updateNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.notificationSettings = { ...user.notificationSettings, ...notifications };
    await user.save();

    res.json({
      success: true,
      message: 'Notification settings updated',
      data: { notifications: user.notificationSettings },
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications',
    });
  }
};

// Search creators
exports.searchCreators = async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;

    let query = { role: 'creator', isBanned: false };

    if (q) {
      query.$text = { $search: q };
    }

    if (category) {
      query['creatorApplication.category'] = category;
    }

    const creators = await User.find(query)
      .select('username avatar bio isCreatorVerified socialLinks subscriberCount')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get subscriber counts for each creator
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        const subscriberCount = await Subscription.countDocuments({
          creator: creator._id,
          status: 'active',
        });
        const postCount = await Post.countDocuments({
          author: creator._id,
          status: 'published',
        });
        return {
          ...creator.toObject(),
          subscriberCount,
          postCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        creators: creatorsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Search creators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search creators',
    });
  }
};

// Get trending creators
exports.getTrendingCreators = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get creators with most subscribers in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trending = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: 'active',
        },
      },
      {
        $group: {
          _id: '$creator',
          newSubscribers: { $sum: 1 },
        },
      },
      {
        $sort: { newSubscribers: -1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const creatorIds = trending.map((t) => t._id);

    const creators = await User.find({ _id: { $in: creatorIds } })
      .select('username avatar bio isCreatorVerified');

    const creatorsWithStats = creators.map((creator) => {
      const trend = trending.find((t) => t._id.toString() === creator._id.toString());
      return {
        ...creator.toObject(),
        newSubscribers: trend?.newSubscribers || 0,
      };
    });

    res.json({
      success: true,
      data: { creators: creatorsWithStats },
    });
  } catch (error) {
    console.error('Get trending creators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending creators',
    });
  }
};

// Get recommended creators
exports.getRecommendedCreators = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { limit = 10 } = req.query;

    let query = { role: 'creator', isBanned: false };

    if (userId) {
      // Get creators user is NOT subscribed to
      const subscriptions = await Subscription.find({
        subscriber: userId,
        status: 'active',
      }).select('creator');

      const subscribedIds = subscriptions.map((s) => s.creator);
      query._id = { $nin: subscribedIds };
    }

    const creators = await User.find(query)
      .select('username avatar bio isCreatorVerified')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { creators },
    });
  } catch (error) {
    console.error('Get recommended creators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommended creators',
    });
  }
};

// Get creator profile
exports.getCreatorProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.userId;

    const creator = await User.findOne({ username, role: 'creator' });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Get stats
    const subscriberCount = await Subscription.countDocuments({
      creator: creator._id,
      status: 'active',
    });

    const postCount = await Post.countDocuments({
      author: creator._id,
      status: 'published',
    });

    // Check if current user is subscribed
    let isSubscribed = false;
    let userSubscription = null;
    if (userId) {
      userSubscription = await Subscription.findOne({
        subscriber: userId,
        creator: creator._id,
        status: 'active',
      });
      isSubscribed = !!userSubscription;
    }

    res.json({
      success: true,
      data: {
        creator: {
          ...creator.toPublicProfile(),
          subscriberCount,
          postCount,
          subscriptionTiers: creator.subscriptionTiers || [],
          location: creator.socialLinks?.website || '',
          about: creator.bio,
        },
        isSubscribed,
        subscription: userSubscription,
      },
    });
  } catch (error) {
    console.error('Get creator profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch creator profile',
    });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('username avatar bio');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      { id: 'programming', name: 'Programming', icon: '💻' },
      { id: 'design', name: 'Design', icon: '🎨' },
      { id: 'business', name: 'Business', icon: '💼' },
      { id: 'marketing', name: 'Marketing', icon: '📈' },
      { id: 'music', name: 'Music', icon: '🎵' },
      { id: 'photography', name: 'Photography', icon: '📷' },
      { id: 'cooking', name: 'Cooking', icon: '🍳' },
      { id: 'fitness', name: 'Fitness', icon: '💪' },
      { id: 'languages', name: 'Languages', icon: '🌍' },
      { id: 'academics', name: 'Academics', icon: '📚' },
    ];

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
};

