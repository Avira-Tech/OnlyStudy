const { Post, User, Subscription, Transaction } = require('../models');

// Create new post
exports.createPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content, contentType, accessType, isFree, price, scheduledAt, tags } = req.body;

    // Allow posts without content if they have media
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Post must have either content or media',
      });
    }

    // Process uploaded files
    let media = [];
    if (req.files && req.files.length > 0) {
      media = req.files.map((file) => ({
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        url: `/uploads/media/${file.filename}`,
        publicId: file.filename,
      }));
    }

    // Determine if content is free based on accessType
    let isContentFree = true;
    if (accessType === 'subscribers' || accessType === 'paid') {
      isContentFree = false;
    }
    // Override with isFree if provided
    if (isFree !== undefined) {
      isContentFree = isFree === 'true' || isFree === true;
    }

    const post = await Post.create({
      author: userId,
      title: title || '',
      content: content || '',
      contentType: contentType || 'text',
      media,
      isFree: isContentFree,
      price: accessType === 'paid' ? (parseFloat(price) || 0) : 0,
      isLocked: !isContentFree,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'published',
      tags: tags || [],
      publishedAt: scheduledAt ? null : new Date(),
    });

    // Populate author details
    await post.populate('author', 'username avatar');

    // Create notification for subscribers (in production, use queue)
    const subscribers = await Subscription.find({
      creator: userId,
      status: 'active',
    });

    const { Notification } = require('../models');
    for (const sub of subscribers) {
      await Notification.createNotification({
        recipient: sub.subscriber,
        sender: userId,
        type: 'post_published',
        title: 'New Post',
        message: `${(await User.findById(userId)).username} published a new post`,
        data: { postId: post._id },
        link: `/post/${post._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message,
    });
  }
};

// Get all posts for a creator
exports.getCreatorPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10, status = 'published' } = req.query;
    const userId = req.user?.userId;

    const creator = await User.findOne({ username, role: 'creator' });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    const query = {
      author: creator._id,
      status: status || 'published'
    };

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    // Check access for each post
    const postsWithAccess = await Promise.all(
      posts.map(async (post) => {
        let hasAccess = post.isFree;

        if (!hasAccess && userId) {
          if (post.author._id.toString() === userId) {
            hasAccess = true;
          } else {
            const subscription = await Subscription.findOne({
              subscriber: userId,
              creator: post.author._id,
              status: 'active',
            });
            hasAccess = !!subscription;
          }
        }

        return {
          ...post.toObject(),
          hasAccess,
          preview: post.getPreview(),
        };
      })
    );

    res.json({
      success: true,
      data: {
        posts: postsWithAccess,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get creator posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
};

// Get all posts for a user by userId
exports.getUserPosts = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const { page = 1, limit = 10, status = 'published' } = req.query;
    const userId = req.user?.userId;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Only allow fetching posts for creators
    if (user.role !== 'creator') {
      return res.status(400).json({
        success: false,
        message: 'User is not a creator',
      });
    }

    const query = {
      author: targetUserId,
      status: status || 'published'
    };

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    // Check access for each post
    const postsWithAccess = await Promise.all(
      posts.map(async (post) => {
        let hasAccess = post.isFree;

        if (!hasAccess && userId) {
          if (post.author._id.toString() === userId) {
            hasAccess = true;
          } else {
            const subscription = await Subscription.findOne({
              subscriber: userId,
              creator: post.author._id,
              status: 'active',
            });
            hasAccess = !!subscription;
          }
        }

        return {
          ...post.toObject(),
          hasAccess,
          preview: post.getPreview(),
        };
      })
    );

    res.json({
      success: true,
      data: {
        posts: postsWithAccess,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
};

// Get current creator's posts (for creator dashboard)
exports.getMyPosts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const query = { author: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
    });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;

    const post = await Post.findById(postId)
      .populate('author', 'username avatar bio isCreatorVerified');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    // Check access
    let hasAccess = post.isFree;
    if (!hasAccess && userId) {
      if (post.author._id.toString() === userId) {
        hasAccess = true;
      } else {
        const subscription = await Subscription.findOne({
          subscriber: userId,
          creator: post.author._id,
          status: 'active',
        });
        hasAccess = !!subscription;
      }
    }

    // Get likes
    const likedByMe = userId ? post.likes.includes(userId) : false;

    res.json({
      success: true,
      data: {
        post: {
          ...post.toObject(),
          hasAccess,
          preview: post.getPreview(),
          likedByMe,
          likes: post.likeCount,
        },
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
    });
  }
};

// Unlock paid content
exports.unlockContent = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.isFree) {
      return res.status(400).json({
        success: false,
        message: 'This post is free',
      });
    }

    // Check if already subscribed
    const subscription = await Subscription.findOne({
      subscriber: userId,
      creator: post.author,
      status: 'active',
    });

    if (subscription) {
      // Already subscribed, grant access
      return res.json({
        success: true,
        message: 'Access granted via subscription',
        data: {
          post: {
            ...post.toObject(),
            hasAccess: true,
            content: post.content,
            media: post.media,
          },
        },
      });
    }

    // Create payment intent for one-time purchase
    const { Transaction } = require('../models');
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(post.price * 100),
      currency: 'usd',
      metadata: {
        userId,
        postId: post._id.toString(),
        type: 'pay_per_view',
      },
    });

    // Create transaction record
    await Transaction.create({
      user: userId,
      type: 'pay_per_view',
      amount: post.price,
      status: 'pending',
      relatedPost: post._id,
      relatedUser: post.author,
      stripePaymentIntentId: paymentIntent.id,
    });

    res.json({
      success: true,
      message: 'Payment required to unlock content',
      data: {
        clientSecret: paymentIntent.client_secret,
        post: post.getPreview(),
      },
    });
  } catch (error) {
    console.error('Unlock content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
    });
  }
};

// Like/Unlike post
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const likeIndex = post.likes.indexOf(userId);
    let isLiked;

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      isLiked = false;
    } else {
      post.likes.push(userId);
      isLiked = true;

      // Notify post author
      if (post.author.toString() !== userId) {
        const { Notification } = require('../models');
        const { User } = require('../models');
        const author = await User.findById(post.author);
        await Notification.createNotification({
          recipient: post.author,
          sender: userId,
          type: 'post_liked',
          title: 'New like',
          message: `${(await User.findById(userId)).username} liked your post`,
          data: { postId: post._id },
          link: `/post/${post._id}`,
        });
      }
    }

    await post.save();

    res.json({
      success: true,
      data: {
        likedByMe: isLiked,
        likes: post.likeCount,
      },
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post',
    });
  }
};

// Update post
exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { title, content, media, isFree, price, tags } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post',
      });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (media !== undefined) post.media = media;
    if (isFree !== undefined) {
      post.isFree = isFree;
      post.isLocked = !isFree;
    }
    if (price !== undefined) post.price = price;
    if (tags !== undefined) post.tags = tags;

    await post.save();
    await post.populate('author', 'username avatar');

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post },
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post',
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post',
    });
  }
};

// Report post
exports.reportPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const { Report } = require('../models');
    await Report.create({
      reporter: userId,
      targetType: 'post',
      targetId: post._id,
      reason,
      description,
    });

    post.isReported = true;
    post.reportCount += 1;
    await post.save();

    res.json({
      success: true,
      message: 'Post reported successfully',
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report post',
    });
  }
};

// Get feed posts (from subscribed creators)
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const subscriptions = await Subscription.find({
      subscriber: userId,
      status: 'active',
    }).select('creator');

    const creatorIds = subscriptions.map((sub) => sub.creator);

    const query = {
      author: { $in: creatorIds },
      status: 'published',
      publishedAt: { $lte: new Date() },
    };

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    const postsWithAccess = posts.map((post) => ({
      ...post.toObject(),
      hasAccess: true,
    }));

    res.json({
      success: true,
      data: {
        posts: postsWithAccess,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feed',
    });
  }
};

