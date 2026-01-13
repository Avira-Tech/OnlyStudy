/**
 * OnlyStudy Backend Test Setup
 * 
 * This file sets up the testing environment utilities.
 * Note: This file is loaded by Jest after it initializes.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer = null;

// Test utilities
const createTestUser = async (overrides = {}) => {
  const { User } = require('../src/models');
  
  const defaultUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'SecurePass123!',
    role: 'student',
    isVerified: true,
    isBanned: false,
  };

  const user = new User({ ...defaultUser, ...overrides });
  await user.save();
  
  return {
    ...user.toObject(),
    password: defaultUser.password,
  };
};

const createTestCreator = async (overrides = {}) => {
  const { User } = require('../src/models');
  
  const defaultCreator = {
    username: `creator_${Date.now()}`,
    email: `creator_${Date.now()}@example.com`,
    password: 'SecurePass123!',
    role: 'creator',
    isVerified: true,
    isCreatorVerified: true,
    isBanned: false,
  };

  const creator = new User({ ...defaultCreator, ...overrides });
  await creator.save();
  
  return {
    ...creator.toObject(),
    password: defaultCreator.password,
  };
};

const createTestAdmin = async (overrides = {}) => {
  const { User } = require('../src/models');
  
  const defaultAdmin = {
    username: `admin_${Date.now()}`,
    email: `admin_${Date.now()}@example.com`,
    password: 'SecurePass123!',
    role: 'admin',
    isVerified: true,
    isBanned: false,
  };

  const admin = new User({ ...defaultAdmin, ...overrides });
  await admin.save();
  
  return {
    ...admin.toObject(),
    password: defaultAdmin.password,
  };
};

const generateTestToken = (userId, role = 'student') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET || 'test_access_secret',
    { expiresIn: '15m' }
  );
};

const generateTestRefreshToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
    { expiresIn: '7d' }
  );
};

const createTestPost = async (authorId, overrides = {}) => {
  const { Post } = require('../src/models');
  
  const defaultPost = {
    author: authorId,
    title: 'Test Post',
    content: 'This is test content for the post.',
    contentType: 'text',
    isFree: true,
    price: 0,
    status: 'published',
    publishedAt: new Date(),
  };

  const post = new Post({ ...defaultPost, ...overrides });
  await post.save();
  
  return post.toObject();
};

const createTestSubscription = async (subscriberId, creatorId, overrides = {}) => {
  const { Subscription } = require('../src/models');
  
  const defaultSubscription = {
    subscriber: subscriberId,
    creator: creatorId,
    tier: 'basic',
    price: 4.99,
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    autoRenew: true,
  };

  const subscription = new Subscription({ ...defaultSubscription, ...overrides });
  await subscription.save();
  
  return subscription.toObject();
};

const createTestLiveStream = async (streamerId, overrides = {}) => {
  const { LiveStream } = require('../src/models');
  
  const defaultStream = {
    streamer: streamerId,
    title: 'Test Live Stream',
    description: 'This is a test live stream',
    status: 'live',
    accessType: 'subscribers',
    price: 0,
    startedAt: new Date(),
    peakViewers: 0,
    totalViewers: 0,
    totalTips: 0,
    tips: [],
  };

  const stream = new LiveStream({ ...defaultStream, ...overrides });
  await stream.save();
  
  return stream.toObject();
};

const createTestConversation = async (participantIds, overrides = {}) => {
  const { Conversation } = require('../src/models');
  
  const defaultConversation = {
    participants: participantIds,
    lastMessageAt: new Date(),
  };

  const conversation = new Conversation({ ...defaultConversation, ...overrides });
  await conversation.save();
  
  return conversation.toObject();
};

const createTestMessage = async (conversationId, senderId, overrides = {}) => {
  const { Message } = require('../src/models');
  
  const defaultMessage = {
    conversation: conversationId,
    sender: senderId,
    content: 'Test message content',
    messageType: 'text',
    isRead: false,
    isDeleted: false,
  };

  const message = new Message({ ...defaultMessage, ...overrides });
  await message.save();
  
  return message.toObject();
};

// Mock Stripe module
const mockStripe = {
  customers: {
    create: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
    retrieve: jest.fn().mockResolvedValue({ id: 'cus_test123' }),
  },
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'pi_test123_secret',
      status: 'succeeded',
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'pi_test123',
      status: 'succeeded',
    }),
  },
  subscriptions: {
    create: jest.fn().mockResolvedValue({ id: 'sub_test123' }),
    retrieve: jest.fn().mockResolvedValue({ id: 'sub_test123', status: 'active' }),
    cancel: jest.fn().mockResolvedValue({ id: 'sub_test123', status: 'cancelled' }),
  },
};

// Export all utilities
module.exports = {
  createTestUser,
  createTestCreator,
  createTestAdmin,
  generateTestToken,
  generateTestRefreshToken,
  createTestPost,
  createTestSubscription,
  createTestLiveStream,
  createTestConversation,
  createTestMessage,
  mockStripe,
};

// Silence console logs during tests (optional, for cleaner output)
if (process.env.SILENT_TESTS !== 'false') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    // Keep error and warn for debugging
    error: console.error,
    warn: console.warn,
  };
}

