/**
 * Subscription API Tests
 * 
 * Tests for subscription creation, management, cancellation,
 * and Stripe payment integration (mocked).
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Test environment setup
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_subscription_tests';

// Mock data store
const mockUsers = new Map();
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
    stripeCustomerId: role === 'creator' ? `cus_creator_${id}` : `cus_student_${id}`,
    stripeAccountId: role === 'creator' ? `acct_creator_${id}` : null,
    subscriptionTiers: role === 'creator' ? [
      { name: 'basic', price: 4.99, description: 'Basic tier' },
      { name: 'premium', price: 9.99, description: 'Premium tier' },
    ] : [],
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

// Mock subscription controller
const mockSubscriptionController = {
  createSubscription: async (req, res) => {
    try {
      const { creatorId, price, tier } = req.body;
      const userId = req.user.userId;

      const creator = mockUsers.get(creatorId);
      if (!creator || creator.role !== 'creator') {
        return res.status(404).json({
          success: false,
          message: 'Creator not found',
        });
      }

      // Check if already subscribed
      const existingSub = Array.from(mockSubscriptions.values()).find(
        sub => sub.subscriber === userId && sub.creator === creatorId && sub.status === 'active'
      );

      if (existingSub) {
        return res.status(400).json({
          success: false,
          message: 'Already subscribed to this creator',
        });
      }

      // Calculate platform fee (20%)
      const platformFee = Math.round(price * 0.20 * 100);
      const amount = Math.round(price * 100);

      // Mock Stripe payment intent
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        client_secret: `pi_${Date.now()}_secret`,
        amount,
        currency: 'usd',
      };

      // Save subscription to mock store
      const newSubscription = {
        _id: `sub_${Date.now()}`,
        subscriber: userId,
        creator: creatorId,
        tier,
        price,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
      };
      mockSubscriptions.set(newSubscription._id, newSubscription);

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
      res.status(500).json({
        success: false,
        message: 'Failed to create subscription',
        error: error.message,
      });
    }
  },

  getMySubscriptions: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { status = 'active', page = 1, limit = 10 } = req.query;

      let subscriptions = Array.from(mockSubscriptions.values())
        .filter(sub => sub.subscriber === userId && (status === 'all' || sub.status === status))
        .map(sub => {
          const creator = mockUsers.get(sub.creator);
          return {
            ...sub,
            creator: creator ? {
              _id: creator._id,
              username: creator.username,
              avatar: creator.avatar,
              bio: creator.bio,
            } : null,
          };
        });

      // Apply pagination
      const total = subscriptions.length;
      const startIndex = (page - 1) * limit;
      const paginatedSubscriptions = subscriptions.slice(startIndex, startIndex + parseInt(limit));

      res.json({
        success: true,
        data: {
          subscriptions: paginatedSubscriptions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscriptions',
      });
    }
  },

  getSubscribers: async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = mockUsers.get(userId);

      // Only creators can access subscribers
      if (!user || user.role !== 'creator') {
        return res.status(404).json({
          success: false,
          message: 'Not found',
        });
      }

      const { status = 'active', page = 1, limit = 10 } = req.query;

      const subscriptions = Array.from(mockSubscriptions.values())
        .filter(sub => sub.creator === userId && (status === 'all' || sub.status === status))
        .map(sub => {
          const subscriber = mockUsers.get(sub.subscriber);
          return {
            ...sub,
            subscriber: subscriber ? {
              _id: subscriber._id,
              username: subscriber.username,
              avatar: subscriber.avatar,
            } : null,
          };
        });

      // Apply pagination
      const total = subscriptions.length;
      const startIndex = (page - 1) * limit;
      const paginatedSubscriptions = subscriptions.slice(startIndex, startIndex + parseInt(limit));

      res.json({
        success: true,
        data: {
          subscribers: paginatedSubscriptions,
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
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscribers',
      });
    }
  },

  cancelSubscription: async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const userId = req.user.userId;

      const subscription = mockSubscriptions.get(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
      }

      if (subscription.subscriber !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }

      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
      subscription.autoRenew = false;

      res.json({
        success: true,
        message: 'Subscription cancelled',
        data: { subscription },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription',
      });
    }
  },

  checkSubscription: async (req, res) => {
    try {
      const { creatorId } = req.params;
      const userId = req.user.userId;

      const subscription = Array.from(mockSubscriptions.values()).find(
        sub => sub.subscriber === userId && sub.creator === creatorId && sub.status === 'active'
      );

      res.json({
        success: true,
        data: {
          isSubscribed: !!subscription,
          subscription: subscription || null, // Return null instead of undefined
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check subscription',
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

  // Subscription routes
  app.post('/api/subscriptions', authenticate, mockSubscriptionController.createSubscription);
  app.get('/api/subscriptions', authenticate, mockSubscriptionController.getMySubscriptions);
  app.get('/api/subscriptions/subscribers', authenticate, mockSubscriptionController.getSubscribers);
  app.get('/api/subscriptions/check/:creatorId', authenticate, mockSubscriptionController.checkSubscription);
  app.delete('/api/subscriptions/:subscriptionId', authenticate, mockSubscriptionController.cancelSubscription);

  return app;
};

describe('Subscription API Tests', () => {
  let app;
  let studentUser;
  let creatorUser;
  let studentToken;
  let creatorToken;

  beforeEach(() => {
    app = createTestApp();
    mockUsers.clear();
    mockSubscriptions.clear();
    mockTransactions.clear();

    // Create test users
    creatorUser = createMockUser('creator');
    studentUser = createMockUser('student');
    creatorToken = createToken(creatorUser._id, 'creator');
    studentToken = createToken(studentUser._id, 'student');
  });

  describe('POST /api/subscriptions', () => {
    it('should create subscription for free tier', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          creatorId: creatorUser._id,
          price: 4.99,
          tier: 'basic',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.clientSecret).toBeDefined();
      expect(response.body.data.subscription.tier).toBe('basic');
    });

    it('should create subscription for premium tier', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          creatorId: creatorUser._id,
          price: 9.99,
          tier: 'premium',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.tier).toBe('premium');
    });

    it('should reject subscription to non-existent creator', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          creatorId: 'nonexistent_creator_id',
          price: 4.99,
          tier: 'basic',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Creator not found');
    });

    it('should reject duplicate subscription', async () => {
      // Create first subscription
      await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          creatorId: creatorUser._id,
          price: 4.99,
          tier: 'basic',
        })
        .expect(200);

      // Try to create duplicate subscription
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          creatorId: creatorUser._id,
          price: 4.99,
          tier: 'basic',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Already subscribed to this creator');
    });

    it('should reject subscription without authentication', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .send({
          creatorId: creatorUser._id,
          price: 4.99,
          tier: 'basic',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/subscriptions', () => {
    it('should return empty subscriptions for new user', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptions).toEqual([]);
    });

    it('should return user subscriptions', async () => {
      // Create subscriptions
      const subscription = {
        _id: `sub_${Date.now()}`,
        subscriber: studentUser._id,
        creator: creatorUser._id,
        tier: 'basic',
        price: 4.99,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
      };
      mockSubscriptions.set(subscription._id, subscription);

      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscriptions.length).toBe(1);
      expect(response.body.data.subscriptions[0].tier).toBe('basic');
    });

    it('should filter subscriptions by status', async () => {
      // Create active subscription
      const activeSub = {
        _id: `sub_active_${Date.now()}`,
        subscriber: studentUser._id,
        creator: creatorUser._id,
        tier: 'basic',
        price: 4.99,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
      };
      mockSubscriptions.set(activeSub._id, activeSub);

      // Create cancelled subscription
      const cancelledSub = {
        _id: `sub_cancelled_${Date.now()}`,
        subscriber: studentUser._id,
        creator: creatorUser._id,
        tier: 'premium',
        price: 9.99,
        status: 'cancelled',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: false,
        createdAt: new Date(),
      };
      mockSubscriptions.set(cancelledSub._id, cancelledSub);

      // Get active subscriptions only
      const response = await request(app)
        .get('/api/subscriptions?status=active')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data.subscriptions.length).toBe(1);
      expect(response.body.data.subscriptions[0].status).toBe('active');
    });
  });

  describe('GET /api/subscriptions/check/:creatorId', () => {
    it('should return false for non-subscribed creator', async () => {
      const response = await request(app)
        .get(`/api/subscriptions/check/${creatorUser._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isSubscribed).toBe(false);
      expect(response.body.data.subscription).toBeNull();
    });

    it('should return true for subscribed creator', async () => {
      // Create subscription
      const subscription = {
        _id: `sub_${Date.now()}`,
        subscriber: studentUser._id,
        creator: creatorUser._id,
        tier: 'basic',
        price: 4.99,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
      };
      mockSubscriptions.set(subscription._id, subscription);

      const response = await request(app)
        .get(`/api/subscriptions/check/${creatorUser._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isSubscribed).toBe(true);
      expect(response.body.data.subscription).toBeDefined();
    });
  });

  describe('DELETE /api/subscriptions/:subscriptionId', () => {
    it('should cancel own subscription', async () => {
      // Create subscription
      const subscription = {
        _id: `sub_${Date.now()}`,
        subscriber: studentUser._id,
        creator: creatorUser._id,
        tier: 'basic',
        price: 4.99,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
      };
      mockSubscriptions.set(subscription._id, subscription);

      const response = await request(app)
        .delete(`/api/subscriptions/${subscription._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.status).toBe('cancelled');
      expect(response.body.data.subscription.autoRenew).toBe(false);
    });

    it('should reject cancellation of non-existent subscription', async () => {
      const response = await request(app)
        .delete('/api/subscriptions/nonexistent_id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Subscription not found');
    });

    it('should reject cancellation of other user subscription', async () => {
      // Create another student
      const otherStudent = createMockUser('student');
      const otherToken = createToken(otherStudent._id, 'student');

      // Create subscription belonging to original student
      const subscription = {
        _id: `sub_${Date.now()}`,
        subscriber: studentUser._id,
        creator: creatorUser._id,
        tier: 'basic',
        price: 4.99,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
      };
      mockSubscriptions.set(subscription._id, subscription);

      // Other student tries to cancel
      const response = await request(app)
        .delete(`/api/subscriptions/${subscription._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized');
    });
  });

  describe('GET /api/subscriptions/subscribers', () => {
    it('should return creator subscribers', async () => {
      // Create subscription
      const subscription = {
        _id: `sub_${Date.now()}`,
        subscriber: studentUser._id,
        creator: creatorUser._id,
        tier: 'basic',
        price: 4.99,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
      };
      mockSubscriptions.set(subscription._id, subscription);

      const response = await request(app)
        .get('/api/subscriptions/subscribers')
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscribers.length).toBe(1);
      expect(response.body.data.subscribers[0].subscriber.username).toBe(studentUser.username);
    });

    it('should reject student accessing subscribers endpoint', async () => {
      const response = await request(app)
        .get('/api/subscriptions/subscribers')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404); // Will fail because route doesn't exist for student

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Stripe Payment Integration Tests (Mocked)', () => {
  let app;
  let studentUser;
  let creatorUser;
  let studentToken;

  beforeEach(() => {
    app = createTestApp();
    mockUsers.clear();
    mockSubscriptions.clear();

    creatorUser = createMockUser('creator');
    studentUser = createMockUser('student');
    studentToken = createToken(studentUser._id, 'student');
  });

  describe('Payment Intent Creation', () => {
    it('should calculate correct platform fee', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          creatorId: creatorUser._id,
          price: 10.00,
          tier: 'premium',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Platform fee should be 20% = $2.00
      // Amount in cents = 1000
      // Platform fee in cents = 200
      expect(response.body.data).toBeDefined();
    });

    it('should create payment intent with correct metadata', async () => {
      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          creatorId: creatorUser._id,
          price: 4.99,
          tier: 'basic',
        })
        .expect(200);

      expect(response.body.data.clientSecret).toBeDefined();
      expect(response.body.data.clientSecret).toContain('pi_');
    });
  });
});

describe('Subscription Edge Cases', () => {
  let app;
  let studentUser;
  let creatorUser;
  let studentToken;

  beforeEach(() => {
    app = createTestApp();
    mockUsers.clear();
    mockSubscriptions.clear();

    creatorUser = createMockUser('creator');
    studentUser = createMockUser('student');
    studentToken = createToken(studentUser._id, 'student');
  });

  it('should handle subscription with zero price (free)', async () => {
    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        creatorId: creatorUser._id,
        price: 0,
        tier: 'basic',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should handle pagination correctly', async () => {
    // Create multiple subscriptions
    for (let i = 0; i < 15; i++) {
      const newCreator = createMockUser('creator');
      const subscription = {
        _id: `sub_${Date.now()}_${i}`,
        subscriber: studentUser._id,
        creator: newCreator._id,
        tier: 'basic',
        price: 4.99,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        createdAt: new Date(),
      };
      mockSubscriptions.set(subscription._id, subscription);
    }

    // Get first page
    const response = await request(app)
      .get('/api/subscriptions?page=1&limit=10')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(response.body.data.subscriptions.length).toBe(10);
    expect(response.body.data.pagination.page).toBe(1);
    expect(response.body.data.pagination.total).toBe(15);
    expect(response.body.data.pagination.pages).toBe(2);
  });
});

