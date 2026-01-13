const { User, Post, Subscription, Transaction, LiveStream, Report, AdminLog } = require('../models');

// Admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCreators,
      totalPosts,
      totalRevenue,
      activeStreams,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'creator' }),
      Post.countDocuments({ status: 'published' }),
      Transaction.aggregate([
        { $match: { type: 'subscription', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      LiveStream.countDocuments({ status: 'live' }),
      Report.countDocuments({ status: 'pending' }),
    ]);

    // User growth (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCreators,
          totalPosts,
          totalRevenue: totalRevenue[0]?.total || 0,
          activeStreams,
          pendingReports,
          newUsers,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
    });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query;

    let query = {};
    if (role) query.role = role;
    if (status === 'active') query.isBanned = false;
    if (status === 'banned') query.isBanned = true;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

// Ban/Unban user
exports.toggleUserBan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { banned } = req.body;
    const adminId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isBanned = banned;
    await user.save();

    // Log action
    await AdminLog.create({
      admin: adminId,
      action: banned ? 'user_ban' : 'user_unban',
      targetType: 'user',
      targetId: userId,
      newState: { isBanned: banned },
    });

    res.json({
      success: true,
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
    });
  } catch (error) {
    console.error('Toggle user ban error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
    });
  }
};

// Verify creator
exports.verifyCreator = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.userId;

    const user = await User.findById(userId);
    if (!user || user.role !== 'creator') {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    user.isCreatorVerified = true;
    await user.save();

    await AdminLog.create({
      admin: adminId,
      action: 'user_verify',
      targetType: 'user',
      targetId: userId,
    });

    res.json({
      success: true,
      message: 'Creator verified successfully',
    });
  } catch (error) {
    console.error('Verify creator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify creator',
    });
  }
};

// Get all content (posts)
exports.getContent = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    let query = {};
    if (status === 'reported') query.isReported = true;
    if (status === 'active') query.isReported = false;
    if (search) {
      query.$text = { $search: search };
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
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content',
    });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.user.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await Post.findByIdAndDelete(postId);

    await AdminLog.create({
      admin: adminId,
      action: 'content_remove',
      targetType: 'post',
      targetId: postId,
    });

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

// Get reports
exports.getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reporter', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
    });
  }
};

// Resolve report
exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body;
    const adminId = req.user.userId;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    report.status = 'resolved';
    report.adminNotes = notes;
    report.resolvedBy = adminId;
    report.resolvedAt = new Date();
    report.actionTaken = action;
    await report.save();

    await AdminLog.create({
      admin: adminId,
      action: 'report_resolve',
      targetType: 'report',
      targetId: reportId,
      details: { action, notes },
    });

    res.json({
      success: true,
      message: 'Report resolved successfully',
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve report',
    });
  }
};

// Get transactions
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('user', 'username avatar')
      .populate('relatedUser', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    // Calculate totals
    const totals = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$platformFee' },
          totalCreatorEarnings: { $sum: '$creatorEarnings' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        totals: totals[0] || { totalAmount: 0, totalFees: 0, totalCreatorEarnings: 0 },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
};

// Get live streams (admin)
exports.getLiveStreams = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;

    const streams = await LiveStream.find(query)
      .populate('streamer', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await LiveStream.countDocuments(query);

    res.json({
      success: true,
      data: {
        streams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get live streams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch streams',
    });
  }
};

// End stream (admin)
exports.endStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const adminId = req.user.userId;

    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    stream.status = 'ended';
    stream.endedAt = new Date();
    await stream.save();

    await AdminLog.create({
      admin: adminId,
      action: 'stream_end',
      targetType: 'live_stream',
      targetId: streamId,
    });

    res.json({
      success: true,
      message: 'Stream ended successfully',
    });
  } catch (error) {
    console.error('End stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end stream',
    });
  }
};

// Get admin logs
exports.getAdminLogs = async (req, res) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;

    let query = {};
    if (action) query.action = action;

    const logs = await AdminLog.find(query)
      .populate('admin', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AdminLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
    });
  }
};

