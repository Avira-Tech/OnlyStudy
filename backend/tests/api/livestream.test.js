/**
 * Live Stream API Tests
 * 
 * Tests for live stream creation, viewing, joining, and management.
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Test environment setup
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_livestream_tests';

// Mock data store
const mockUsers = new Map();
const mockStreams = new Map();
const mockSubscriptions = new Map();
const mockTransactions = new Map();

// Helper to create mock user
const createMockUser = (role = 'student') => {
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user = {
    _id: id,
    username: `test_${role}_${Date.now()}`,
    email: `test_${role}@example.com`,
    password: 'hashed_password',
    role,
    isVerified: true,
    isBanned: false,
    isCreatorVerified: role === 'creator',
    avatar: '/uploads/avatars/default.png',
    bio: 'Test bio',
    stripeAccountId: role === 'creator' ? `acct_${id}` : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockUsers.set(id, user);
  return user;
};

// Helper to create auth token
const createToken = (userId, role = 'student') => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

// Mock Live Stream Controller
const mockLiveStreamController = {
  createStream: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { title, description, accessType, price, scheduledAt } = req.body;

      const user = mockUsers.get(userId);
      if (!user || user.role !== 'creator') {
        return res.status(403).json({
          success: false,
          message: 'Only creators can start live streams',
        });
      }

      const streamId = `stream_${Date.now()}`;
      const streamKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const stream = {
        _id: streamId,
        streamer: userId,
        title,
        description,
        status: scheduledAt ? 'scheduled' : 'live',
        accessType: accessType || 'subscribers',
        price: price || 0,
        streamKey,
        startedAt: scheduledAt ? null : new Date(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        peakViewers: 0,
        totalViewers: 0,
        totalTips: 0,
        tips: [],
        chatEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStreams.set(streamId, stream);

      res.status(201).json({
        success: true,
        message: 'Live stream created',
        data: {
          stream,
          streamKey,
          rtmpUrl: `rtmp://localhost/live/${streamKey}`,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create stream',
        error: error.message,
      });
    }
  },

  getStream: async (req, res) => {
    try {
      const { streamId } = req.params;
      const userId = req.user?.userId;

      const stream = mockStreams.get(streamId);
      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found',
        });
      }

      // Check access
      let hasAccess = false;
      const streamer = mockUsers.get(stream.streamer);

      if (stream.accessType === 'free') {
        hasAccess = true;
      } else if (stream.accessType === 'subscribers' && userId) {
        const subscription = Array.from(mockSubscriptions.values()).find(
          sub => sub.subscriber === userId && sub.creator === stream.streamer && sub.status === 'active'
        );
        hasAccess = !!subscription || stream.streamer === userId;
      } else if (stream.accessType === 'paid' && userId) {
        const payment = Array.from(mockTransactions.values()).find(
          t => t.user === userId && t.relatedLiveStream === streamId && t.status === 'completed'
        );
        hasAccess = !!payment || stream.streamer === userId;
      }

      res.json({
        success: true,
        data: {
          stream: {
            ...stream,
            streamer: streamer ? {
              _id: streamer._id,
              username: streamer.username,
              avatar: streamer.avatar,
              bio: streamer.bio,
              isCreatorVerified: streamer.isCreatorVerified,
            } : null,
            hasAccess,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stream',
      });
    }
  },

  getLiveStreams: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const streams = Array.from(mockStreams.values())
        .filter(s => s.status === 'live')
        .map(s => {
          const streamer = mockUsers.get(s.streamer);
          return {
            ...s,
            streamer: streamer ? {
              _id: streamer._id,
              username: streamer.username,
              avatar: streamer.avatar,
            } : null,
          };
        });

      res.json({
        success: true,
        data: {
          streams,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: streams.length,
            pages: Math.ceil(streams.length / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch streams',
      });
    }
  },

  joinStream: async (req, res) => {
    try {
      const { streamId } = req.params;
      const userId = req.user.userId;

      const stream = mockStreams.get(streamId);
      if (!stream || stream.status !== 'live') {
        return res.status(404).json({
          success: false,
          message: 'Stream not found or not live',
        });
      }

      // Increment viewer count
      stream.totalViewers += 1;
      if (stream.totalViewers > stream.peakViewers) {
        stream.peakViewers = stream.totalViewers;
      }

      res.json({
        success: true,
        data: {
          streamKey: stream.streamKey,
          playbackUrl: stream.playbackUrl,
          currentViewers: stream.totalViewers,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to join stream',
      });
    }
  },

  endStream: async (req, res) => {
    try {
      const { streamId } = req.params;
      const userId = req.user.userId;

      const stream = mockStreams.get(streamId);
      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found',
        });
      }

      if (stream.streamer !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to end this stream',
        });
      }

      stream.status = 'ended';
      stream.endedAt = new Date();
      stream.duration = Math.floor((stream.endedAt - stream.startedAt) / 1000);

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
      res.status(500).json({
        success: false,
        message: 'Failed to end stream',
      });
    }
  },

  sendTip: async (req, res) => {
    try {
      const { streamId } = req.params;
      const userId = req.user.userId;
      const { amount, message } = req.body;

      const stream = mockStreams.get(streamId);
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

      // Add tip
      stream.tips.push({
        user: userId,
        amount,
        message,
        createdAt: new Date(),
      });
      stream.totalTips += amount;

      res.json({
        success: true,
        message: 'Tip sent successfully',
        data: {
          amount,
          totalTips: stream.totalTips,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send tip',
      });
    }
  },

  getCreatorStreams: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { status, page = 1, limit = 10 } = req.query;

      const query = { streamer: userId };
      if (status) {
        query.status = status;
      }

      const streams = Array.from(mockStreams.values())
        .filter(s => s.streamer === userId && (!status || s.status === status))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.json({
        success: true,
        data: {
          streams,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: streams.length,
            pages: Math.ceil(streams.length / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch streams',
      });
    }
  },
};

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Live stream routes
  app.post('/api/streams', authenticate, mockLiveStreamController.createStream);
  app.get('/api/streams', authenticate, mockLiveStreamController.getLiveStreams);
  app.get('/api/streams/:streamId', authenticate, mockLiveStreamController.getStream);
  app.post('/api/streams/:streamId/join', authenticate, mockLiveStreamController.joinStream);
  app.post('/api/streams/:streamId/tip', authenticate, mockLiveStreamController.sendTip);
  app.post('/api/streams/:streamId/end', authenticate, mockLiveStreamController.endStream);
  app.get('/api/streams/creator/me', authenticate, mockLiveStreamController.getCreatorStreams);

  return app;
};

describe('Live Stream API Tests', () => {
  let app;
  let studentUser;
  let creatorUser;
  let studentToken;
  let creatorToken;

  beforeEach(() => {
    app = createTestApp();
    mockUsers.clear();
    mockStreams.clear();
    mockSubscriptions.clear();
    mockTransactions.clear();

    creatorUser = createMockUser('creator');
    studentUser = createMockUser('student');
    creatorToken = createToken(creatorUser._id, 'creator');
    studentToken = createToken(studentUser._id, 'student');
  });

  describe('POST /api/streams', () => {
    it('should create free stream', async () => {
      const response = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Free Live Stream',
          description: 'This is a free stream',
          accessType: 'free',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream.title).toBe('Free Live Stream');
      expect(response.body.data.stream.accessType).toBe('free');
      expect(response.body.data.streamKey).toBeDefined();
    });

    it('should create subscriber-only stream', async () => {
      const response = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Subscriber Only Stream',
          accessType: 'subscribers',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream.accessType).toBe('subscribers');
    });

    it('should create paid stream', async () => {
      const response = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Premium Stream',
          accessType: 'paid',
          price: 9.99,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream.accessType).toBe('paid');
      expect(response.body.data.stream.price).toBe(9.99);
    });

    it('should reject stream creation by student', async () => {
      const response = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Stream',
          accessType: 'free',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Only creators can start live streams');
    });

    it('should reject stream creation without authentication', async () => {
      const response = await request(app)
        .post('/api/streams')
        .send({
          title: 'Anonymous Stream',
          accessType: 'free',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should create scheduled stream', async () => {
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const response = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({
          title: 'Scheduled Stream',
          accessType: 'subscribers',
          scheduledAt: scheduledTime,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream.status).toBe('scheduled');
      expect(response.body.data.stream.scheduledAt).toBeDefined();
    });
  });

  describe('GET /api/streams', () => {
    it('should return live streams', async () => {
      // Create a stream
      await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Live Stream 1', accessType: 'free' })
        .expect(201);

      const response = await request(app)
        .get('/api/streams')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streams.length).toBe(1);
    });

    it('should return empty list when no streams', async () => {
      const response = await request(app)
        .get('/api/streams')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streams).toEqual([]);
    });
  });

  describe('GET /api/streams/:streamId', () => {
    let streamId;

    beforeEach(async () => {
      // Create a stream
      const response = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Test Stream', accessType: 'subscribers' })
        .expect(201);
      
      streamId = response.body.data.stream._id;
    });

    it('should return stream details', async () => {
      const response = await request(app)
        .get(`/api/streams/${streamId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream.title).toBe('Test Stream');
      expect(response.body.data.stream.streamer.username).toBe(creatorUser.username);
    });

    it('should return 404 for non-existent stream', async () => {
      const response = await request(app)
        .get('/api/streams/nonexistent_stream_id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Stream not found');
    });

    it('should grant access to free stream', async () => {
      // Create free stream
      const freeStreamRes = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Free Stream', accessType: 'free' })
        .expect(201);

      const response = await request(app)
        .get(`/api/streams/${freeStreamRes.body.data.stream._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data.stream.hasAccess).toBe(true);
    });

    it('should deny access to subscriber-only stream without subscription', async () => {
      const response = await request(app)
        .get(`/api/streams/${streamId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data.stream.hasAccess).toBe(false);
    });

    it('should grant access to subscriber-only stream with subscription', async () => {
      // Create subscription
      const subscription = {
        _id: `sub_${Date.now()}`,
        subscriber: studentUser._id,
        creator: creatorUser._id,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      mockSubscriptions.set(subscription._id, subscription);

      const response = await request(app)
        .get(`/api/streams/${streamId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data.stream.hasAccess).toBe(true);
    });

    it('should grant access to streamer', async () => {
      const response = await request(app)
        .get(`/api/streams/${streamId}`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body.data.stream.hasAccess).toBe(true);
    });
  });

  describe('POST /api/streams/:streamId/join', () => {
    let streamId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Test Stream', accessType: 'free' })
        .expect(201);
      
      streamId = response.body.data.stream._id;
    });

    it('should join stream and increment viewers', async () => {
      const response = await request(app)
        .post(`/api/streams/${streamId}/join`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentViewers).toBe(1);
      expect(response.body.data.streamKey).toBeDefined();
    });

    it('should reject joining non-live stream', async () => {
      // End the stream
      await request(app)
        .post(`/api/streams/${streamId}/end`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      const response = await request(app)
        .post(`/api/streams/${streamId}/join`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/streams/:streamId/end', () => {
    it('should end own stream', async () => {
      const createRes = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'My Stream', accessType: 'free' })
        .expect(201);

      const streamId = createRes.body.data.stream._id;

      // Wait a bit to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .post(`/api/streams/${streamId}/end`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.duration).toBeDefined();
      expect(response.body.data.peakViewers).toBeDefined();
    });

    it('should reject ending another creator stream', async () => {
      const createRes = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'My Stream', accessType: 'free' })
        .expect(201);

      const streamId = createRes.body.data.stream._id;

      // Create another creator
      const otherCreator = createMockUser('creator');
      const otherToken = createToken(otherCreator._id, 'creator');

      const response = await request(app)
        .post(`/api/streams/${streamId}/end`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to end any stream', async () => {
      const createRes = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Creator Stream', accessType: 'free' })
        .expect(201);

      const streamId = createRes.body.data.stream._id;

      // Create admin
      const adminUser = createMockUser('admin');
      const adminToken = createToken(adminUser._id, 'admin');

      const response = await request(app)
        .post(`/api/streams/${streamId}/end`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/streams/:streamId/tip', () => {
    let streamId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Test Stream', accessType: 'free' })
        .expect(201);
      
      streamId = createRes.body.data.stream._id;
    });

    it('should send tip', async () => {
      const response = await request(app)
        .post(`/api/streams/${streamId}/tip`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 5.00, message: 'Great stream!' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(5.00);
      expect(response.body.data.totalTips).toBe(5.00);
    });

    it('should send multiple tips', async () => {
      await request(app)
        .post(`/api/streams/${streamId}/tip`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 5.00 })
        .expect(200);

      const response = await request(app)
        .post(`/api/streams/${streamId}/tip`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 10.00 })
        .expect(200);

      expect(response.body.data.totalTips).toBe(15.00);
    });

    it('should reject tip to non-live stream', async () => {
      // End the stream
      await request(app)
        .post(`/api/streams/${streamId}/end`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      const response = await request(app)
        .post(`/api/streams/${streamId}/tip`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ amount: 5.00 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Stream is not live');
    });
  });

  describe('GET /api/streams/creator/me', () => {
    it('should return creator streams', async () => {
      // Create multiple streams
      await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Stream 1', accessType: 'free' })
        .expect(201);

      await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Stream 2', accessType: 'subscribers' })
        .expect(201);

      const response = await request(app)
        .get('/api/streams/creator/me')
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streams.length).toBe(2);
    });

    it('should filter streams by status', async () => {
      // Create live stream
      await request(app)
        .post('/api/streams')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ title: 'Live Stream', accessType: 'free' })
        .expect(201);

      const response = await request(app)
        .get('/api/streams/creator/me?status=live')
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body.data.streams.every(s => s.status === 'live')).toBe(true);
    });
  });
});

