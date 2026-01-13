/**
 * Admin API Tests
 * 
 * Tests for admin dashboard, user management, content moderation,
 * and platform administration features.
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Test environment setup
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_admin_tests';

// Mock data store
const mockUsers = new Map();
const mockPosts = new Map();
const mockReports = new Map();
const mockTransactions = new Map();
const mockStreams = new Map();

// Helper to create mock user
const createMockUser = (role = 'student') => {
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user = {
    _id: id,
    username: `test_${role}_${Date.now()}`,
    email: `test_${role}@example.com`,
    password: 'hashed_password',
    role,
    isVerified: role !== 'student' || Math.random() > 0.5,
    isBanned: false,
    isCreatorVerified: role === 'creator',
    avatar: '/uploads/avatars/default.png',
    bio: 'Test bio',
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

// Mock Admin Controller
const mockAdminController = {
  getDashboardStats: async (req, res) => {
    try {
      const totalUsers = mockUsers.size;
      const totalPosts = mockPosts.size;
      const totalRevenue = Array.from(mockTransactions.values())
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
      const activeStreams = Array.from(mockStreams.values())
        .filter(s => s.status === 'live').length;

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            totalPosts,
            totalRevenue,
            activeStreams,
            newUsersToday: Math.floor(totalUsers * 0.1),
            revenueThisMonth: totalRevenue * 0.3,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard stats',
      });
    }
  },

  getUsers: async (req, res) => {
    try {
      const { page = 1, limit = 20, search, role, isBanned } = req.query;

      let users = Array.from(mockUsers.values());

      // Filter by role
      if (role && role !== 'all') {
        users = users.filter(u => u.role === role);
      }

      // Filter by banned status
      if (isBanned !== undefined) {
        users = users.filter(u => u.isBanned === (isBanned === 'true'));
      }

      // Search by username or email
      if (search) {
        users = users.filter(u => 
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      const paginatedUsers = users.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        data: {
          users: paginatedUsers,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: users.length,
            pages: Math.ceil(users.length / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
      });
    }
  },

  toggleUserBan: async (req, res) => {
    try {
      const { userId } = req.params;
      const { ban } = req.body;

      const user = mockUsers.get(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      user.isBanned = ban;
      user.updatedAt = new Date();

      res.json({
        success: true,
        message: ban ? 'User banned successfully' : 'User unbanned successfully',
        data: { user },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
      });
    }
  },

  verifyCreator: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = mockUsers.get(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.role !== 'creator') {
        return res.status(400).json({
          success: false,
          message: 'User is not a creator',
        });
      }

      user.isCreatorVerified = true;
      user.updatedAt = new Date();

      res.json({
        success: true,
        message: 'Creator verified successfully',
        data: { user },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify creator',
      });
    }
  },

  getContent: async (req, res) => {
    try {
      const { page = 1, limit = 20, type, reported } = req.query;

      let posts = Array.from(mockPosts.values());

      if (reported === 'true') {
        posts = posts.filter(p => p.isReported);
      }

      const paginatedPosts = posts.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        data: {
          posts: paginatedPosts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: posts.length,
            pages: Math.ceil(posts.length / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content',
      });
    }
  },

  deletePost: async (req, res) => {
    try {
      const { postId } = req.params;

      const post = mockPosts.get(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found',
        });
      }

      mockPosts.delete(postId);

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete post',
      });
    }
  },

  getReports: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;

      let reports = Array.from(mockReports.values());

      if (status && status !== 'all') {
        reports = reports.filter(r => r.status === status);
      }

      const paginatedReports = reports.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        data: {
          reports: paginatedReports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: reports.length,
            pages: Math.ceil(reports.length / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reports',
      });
    }
  },

  resolveReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      const { action } = req.body;

      const report = mockReports.get(reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      report.status = 'resolved';
      report.resolvedAt = new Date();
      report.resolvedBy = req.user.userId;
      report.action = action;

      res.json({
        success: true,
        message: 'Report resolved successfully',
        data: { report },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to resolve report',
      });
    }
  },

  getTransactions: async (req, res) => {
    try {
      const { page = 1, limit = 20, type } = req.query;

      let transactions = Array.from(mockTransactions.values());

      if (type && type !== 'all') {
        transactions = transactions.filter(t => t.type === type);
      }

      const paginatedTransactions = transactions.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        data: {
          transactions: paginatedTransactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: transactions.length,
            pages: Math.ceil(transactions.length / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
      });
    }
  },

  getLiveStreams: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;

      let streams = Array.from(mockStreams.values());

      if (status) {
        streams = streams.filter(s => s.status === status);
      }

      const paginatedStreams = streams.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        data: {
          streams: paginatedStreams,
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

  endStream: async (req, res) => {
    try {
      const { streamId } = req.params;

      const stream = mockStreams.get(streamId);
      if (!stream) {
        return res.status(404).json({
          success: false,
          message: 'Stream not found',
        });
      }

      stream.status = 'ended';
      stream.endedAt = new Date();

      res.json({
        success: true,
        message: 'Stream ended successfully',
        data: { stream },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to end stream',
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

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }
    next();
  };
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Admin routes (all require admin role)
  app.use('/api/admin', authenticate, authorize('admin'));

  app.get('/api/admin/dashboard', mockAdminController.getDashboardStats);
  app.get('/api/admin/users', mockAdminController.getUsers);
  app.put('/api/admin/users/:userId/ban', mockAdminController.toggleUserBan);
  app.put('/api/admin/users/:userId/verify', mockAdminController.verifyCreator);
  app.get('/api/admin/content', mockAdminController.getContent);
  app.delete('/api/admin/content/:postId', mockAdminController.deletePost);
  app.get('/api/admin/reports', mockAdminController.getReports);
  app.put('/api/admin/reports/:reportId/resolve', mockAdminController.resolveReport);
  app.get('/api/admin/transactions', mockAdminController.getTransactions);
  app.get('/api/admin/streams', mockAdminController.getLiveStreams);
  app.post('/api/admin/streams/:streamId/end', mockAdminController.endStream);

  return app;
};

describe('Admin API Tests', () => {
  let app;
  let adminUser;
  let studentUser;
  let creatorUser;
  let adminToken;
  let studentToken;
  let creatorToken;

  beforeEach(() => {
    app = createTestApp();
    mockUsers.clear();
    mockPosts.clear();
    mockReports.clear();
    mockTransactions.clear();
    mockStreams.clear();

    adminUser = createMockUser('admin');
    studentUser = createMockUser('student');
    creatorUser = createMockUser('creator');
    adminToken = createToken(adminUser._id, 'admin');
    studentToken = createToken(studentUser._id, 'student');
    creatorToken = createToken(creatorUser._id, 'creator');
  });

  describe('Dashboard', () => {
    it('should return dashboard stats for admin', async () => {
      // Create some test data
      createMockUser('student');
      createMockUser('creator');
      mockPosts.set('post1', { _id: 'post1', title: 'Test Post' });
      mockTransactions.set('tx1', { _id: 'tx1', amount: 100, status: 'completed' });
      mockStreams.set('stream1', { _id: 'stream1', status: 'live' });

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalUsers).toBe(5); // admin + student + creator + test student + test creator
      expect(response.body.data.stats.totalPosts).toBe(1);
      expect(response.body.data.stats.activeStreams).toBe(1);
    });

    it('should reject dashboard access for non-admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject dashboard access without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('User Management', () => {
    it('should return all users for admin', async () => {
      createMockUser('student');
      createMockUser('creator');

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBe(5); // admin + student + creator + test student + test creator
    });

    it('should filter users by role', async () => {
      createMockUser('student');
      createMockUser('creator');
      createMockUser('student');

      const response = await request(app)
        .get('/api/admin/users?role=student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users.every(u => u.role === 'student')).toBe(true);
    });

    it('should filter users by banned status', async () => {
      const bannedUser = createMockUser('student');
      bannedUser.isBanned = true;
      createMockUser('student');

      const response = await request(app)
        .get('/api/admin/users?isBanned=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users.every(u => u.isBanned === true)).toBe(true);
    });

    it('should search users by username or email', async () => {
      createMockUser('student');
      const searchUser = createMockUser('creator');
      searchUser.username = 'searchtarget';
      searchUser.email = 'search@example.com';

      const response = await request(app)
        .get('/api/admin/users?search=search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users.length).toBe(1);
    });

    it('should ban user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentUser._id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ban: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isBanned).toBe(true);
    });

    it('should unban user', async () => {
      studentUser.isBanned = true;

      const response = await request(app)
        .put(`/api/admin/users/${studentUser._id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ban: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isBanned).toBe(false);
    });

    it('should verify creator', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${creatorUser._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.isCreatorVerified).toBe(true);
    });

    it('should reject verifying non-creator', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${studentUser._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User is not a creator');
    });
  });

  describe('Content Management', () => {
    beforeEach(() => {
      // Create some posts
      mockPosts.set('post1', {
        _id: 'post1',
        title: 'Test Post 1',
        author: studentUser._id,
        isReported: false,
      });
      mockPosts.set('post2', {
        _id: 'post2',
        title: 'Reported Post',
        author: creatorUser._id,
        isReported: true,
      });
    });

    it('should return all content', async () => {
      const response = await request(app)
        .get('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.posts.length).toBe(2);
    });

    it('should filter reported content', async () => {
      const response = await request(app)
        .get('/api/admin/content?reported=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.posts.length).toBe(1);
      expect(response.body.data.posts[0].isReported).toBe(true);
    });

    it('should delete post', async () => {
      const response = await request(app)
        .delete('/api/admin/content/post1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPosts.has('post1')).toBe(false);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .delete('/api/admin/content/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Reports Management', () => {
    beforeEach(() => {
      mockReports.set('report1', {
        _id: 'report1',
        post: 'post1',
        reporter: studentUser._id,
        reason: 'Inappropriate content',
        status: 'pending',
      });
      mockReports.set('report2', {
        _id: 'report2',
        post: 'post2',
        reporter: creatorUser._id,
        reason: 'Spam',
        status: 'resolved',
      });
    });

    it('should return all reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.reports.length).toBe(2);
    });

    it('should filter reports by status', async () => {
      const response = await request(app)
        .get('/api/admin/reports?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.reports.length).toBe(1);
      expect(response.body.data.reports[0].status).toBe('pending');
    });

    it('should resolve report', async () => {
      const response = await request(app)
        .put('/api/admin/reports/report1/resolve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'content_removed' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.report.status).toBe('resolved');
      expect(response.body.data.report.action).toBe('content_removed');
    });
  });

  describe('Transactions', () => {
    beforeEach(() => {
      mockTransactions.set('tx1', {
        _id: 'tx1',
        user: studentUser._id,
        type: 'subscription',
        amount: 9.99,
        status: 'completed',
        createdAt: new Date(),
      });
      mockTransactions.set('tx2', {
        _id: 'tx2',
        user: creatorUser._id,
        type: 'withdrawal',
        amount: 50.00,
        status: 'pending',
        createdAt: new Date(),
      });
    });

    it('should return all transactions', async () => {
      const response = await request(app)
        .get('/api/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.transactions.length).toBe(2);
    });

    it('should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/admin/transactions?type=subscription')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.transactions.length).toBe(1);
      expect(response.body.data.transactions[0].type).toBe('subscription');
    });
  });

  describe('Live Streams Management', () => {
    beforeEach(() => {
      mockStreams.set('stream1', {
        _id: 'stream1',
        title: 'Live Stream 1',
        streamer: creatorUser._id,
        status: 'live',
      });
      mockStreams.set('stream2', {
        _id: 'stream2',
        title: 'Ended Stream',
        streamer: creatorUser._id,
        status: 'ended',
      });
    });

    it('should return all streams', async () => {
      const response = await request(app)
        .get('/api/admin/streams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.streams.length).toBe(2);
    });

    it('should filter streams by status', async () => {
      const response = await request(app)
        .get('/api/admin/streams?status=live')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.streams.length).toBe(1);
      expect(response.body.data.streams[0].status).toBe('live');
    });

    it('should end stream', async () => {
      const response = await request(app)
        .post('/api/admin/streams/stream1/end')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stream.status).toBe('ended');
    });
  });
});

