const { LiveStream, User, Subscription, Transaction } = require('../models');

// Create new live stream
exports.createStream = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, accessType, price, scheduledAt } = req.body;

    const user = await User.findById(userId);
    if (user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Only creators can start live streams',
      });
    }

    const stream = await LiveStream.create({
      streamer: userId,
      title,
      description,
      accessType: accessType || 'subscribers',
      price: price || 0,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'live',
      startedAt: scheduledAt ? null : new Date(),
    });

    await stream.populate('streamer', 'username avatar');

    // Notify subscribers
    const { Notification } = require('../models');
    const subscribers = await Subscription.find({
      creator: userId,
      status: 'active',
    });

    for (const sub of subscribers) {
      await Notification.createNotification({
        recipient: sub.subscriber,
        sender: userId,
        type: 'live_stream_started',
        title: 'Live Stream Started',
        message: `${user.username} is now live: ${title}`,
        data: { streamId: stream._id },
        link: `/live/${stream._id}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Live stream created',
      data: {
        stream,
        streamKey: stream.streamKey,
        rtmpUrl: `${process.env.RTMP_URL || 'rtmp://localhost/live'}/${stream.streamKey}`,
      },
    });
  } catch (error) {
    console.error('Create stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stream',
    });
  }
};

// Get stream details
exports.getStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user?.userId;

    const stream = await LiveStream.findById(streamId)
      .populate('streamer', 'username avatar bio isCreatorVerified');

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    // Check access
    let hasAccess = false;
    if (stream.accessType === 'free') {
      hasAccess = true;
    } else if (stream.accessType === 'subscribers' && userId) {
      const subscription = await Subscription.findOne({
        subscriber: userId,
        creator: stream.streamer._id,
        status: 'active',
      });
      hasAccess = !!subscription || stream.streamer._id.toString() === userId;
    } else if (stream.accessType === 'paid' && userId) {
      // Check if user already paid
      const payment = await Transaction.findOne({
        user: userId,
        relatedLiveStream: stream._id,
        status: 'completed',
      });
      hasAccess = !!payment || stream.streamer._id.toString() === userId;
    }

    res.json({
      success: true,
      data: {
        stream: {
          ...stream.toObject(),
          hasAccess,
        },
      },
    });
  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stream',
    });
  }
};

// End stream
exports.endStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user.userId;

    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    if (stream.streamer.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this stream',
      });
    }

    stream.status = 'ended';
    stream.endedAt = new Date();
    stream.duration = Math.floor((stream.endedAt - stream.startedAt) / 1000);
    await stream.save();

    res.json({
      success: true,
      message: 'Stream ended',
      data: {
        duration: stream.duration,
        peakViewers: stream.peakViewers,
        totalTips: stream.totalTips,
      },
    });
  } catch (error) {
    console.error('End stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end stream',
    });
  }
};

// Join stream (for access tracking)
exports.joinStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user.userId;

    const stream = await LiveStream.findById(streamId);
    if (!stream || stream.status !== 'live') {
      return res.status(404).json({
        success: false,
        message: 'Stream not found or not live',
      });
    }

    // Increment viewer count (in real app, track unique viewers)
    stream.totalViewers += 1;
    if (stream.totalViewers > stream.peakViewers) {
      stream.peakViewers = stream.totalViewers;
    }
    await stream.save();

    res.json({
      success: true,
      data: {
        streamKey: stream.streamKey,
        playbackUrl: stream.playbackUrl,
        currentViewers: stream.totalViewers,
      },
    });
  } catch (error) {
    console.error('Join stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join stream',
    });
  }
};

// Send tip during stream
exports.sendTip = async (req, res) => {
  try {
    const { streamId } = req.params;
    const userId = req.user.userId;
    const { amount, message } = req.body;

    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is not live',
      });
    }

    // Process payment
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const user = await User.findById(userId);
    const creator = await User.findById(stream.streamer);

    const platformFee = Math.round(amount * 0.20 * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: user.stripeCustomerId,
      transfer_data: {
        destination: creator.stripeAccountId,
        amount: Math.round(amount * 100) - platformFee,
      },
    });

    // Add tip to stream
    stream.tips.push({
      user: userId,
      amount,
      message,
    });
    stream.totalTips += amount;
    await stream.save();

    // Create transaction
    await Transaction.create({
      user: userId,
      type: 'tip',
      amount,
      status: 'completed',
      relatedUser: stream.streamer,
      relatedLiveStream: stream._id,
      platformFee: amount * 0.20,
      creatorEarnings: amount * 0.80,
      description: `Tip for ${stream.title}`,
    });

    // Notify streamer
    const { Notification } = require('../models');
    await Notification.createNotification({
      recipient: stream.streamer,
      sender: userId,
      type: 'tip_received',
      title: 'New Tip',
      message: `${user.username} sent you a $${amount} tip!`,
      data: { streamId, amount },
    });

    res.json({
      success: true,
      message: 'Tip sent successfully',
      data: {
        amount,
        totalTips: stream.totalTips,
      },
    });
  } catch (error) {
    console.error('Send tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send tip',
    });
  }
};

// Get creator's streams
exports.getCreatorStreams = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { streamer: userId };
    if (status) {
      query.status = status;
    }

    const streams = await LiveStream.find(query)
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
    console.error('Get creator streams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch streams',
    });
  }
};

// Get live streams (explore)
exports.getLiveStreams = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const streams = await LiveStream.find({ status: 'live' })
      .populate('streamer', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await LiveStream.countDocuments({ status: 'live' });

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

