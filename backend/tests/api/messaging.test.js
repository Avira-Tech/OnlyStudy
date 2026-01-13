/**
 * Messaging API Tests
 * 
 * Tests for conversation management and real-time messaging.
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Test environment setup
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_messaging_tests';

// Mock data store
const mockUsers = new Map();
const mockConversations = new Map();
const mockMessages = new Map();

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
    avatar: '/uploads/avatars/default.png',
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

// Mock Message Controller
const mockMessageController = {
  getOrCreateConversation: async (req, res) => {
    try {
      const { userId: otherUserId } = req.body;
      const currentUserId = req.user.userId;

      // Check if conversation exists
      let conversation = Array.from(mockConversations.values()).find(c =>
        c.participants.includes(currentUserId) && c.participants.includes(otherUserId)
      );

      if (!conversation) {
        const otherUser = mockUsers.get(otherUserId);
        if (!otherUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }

        conversation = {
          _id: `conv_${Date.now()}`,
          participants: [currentUserId, otherUserId],
          lastMessage: null,
          lastMessageAt: new Date(),
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockConversations.set(conversation._id, conversation);
      }

      const participants = conversation.participants.map(pid => {
        const user = mockUsers.get(pid);
        return user ? {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
        } : null;
      }).filter(Boolean);

      res.json({
        success: true,
        data: { conversation: { ...conversation, participants } },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get conversation',
      });
    }
  },

  getConversations: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const conversations = Array.from(mockConversations.values())
        .filter(c => c.participants.includes(userId) && !c.isArchived)
        .map(c => {
          const otherParticipantId = c.participants.find(p => p !== userId);
          const otherUser = mockUsers.get(otherParticipantId);
          
          const unreadCount = Array.from(mockMessages.values()).filter(
            m => m.conversation === c._id && m.sender !== userId && !m.isRead
          ).length;

          return {
            ...c,
            otherParticipant: otherUser ? {
              _id: otherUser._id,
              username: otherUser.username,
              avatar: otherUser.avatar,
              role: otherUser.role,
            } : null,
            unreadCount,
          };
        })
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: conversations.length,
            pages: Math.ceil(conversations.length / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations',
      });
    }
  },

  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.userId;
      const { page = 1, limit = 50 } = req.query;

      const conversation = mockConversations.get(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this conversation',
        });
      }

      const allMessages = Array.from(mockMessages.values())
        .filter(m => m.conversation === conversationId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const messages = allMessages
        .slice((page - 1) * limit, page * limit)
        .reverse()
        .map(m => {
          const sender = mockUsers.get(m.sender);
          return {
            ...m,
            sender: sender ? {
              _id: sender._id,
              username: sender.username,
              avatar: sender.avatar,
            } : null,
          };
        });

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: allMessages.length,
            pages: Math.ceil(allMessages.length / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
      });
    }
  },

  sendMessage: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content, messageType = 'text', media } = req.body;
      const userId = req.user.userId;

      const conversation = mockConversations.get(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to send message',
        });
      }

      const message = {
        _id: `msg_${Date.now()}`,
        conversation: conversationId,
        sender: userId,
        content,
        messageType,
        media: media || [],
        isRead: false,
        isDeleted: false,
        createdAt: new Date(),
      };
      mockMessages.set(message._id, message);

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();

      const sender = mockUsers.get(userId);

      res.status(201).json({
        success: true,
        data: {
          message: {
            ...message,
            sender: sender ? {
              _id: sender._id,
              username: sender.username,
              avatar: sender.avatar,
            } : null,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
      });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.userId;

      Array.from(mockMessages.values())
        .filter(m => m.conversation === conversationId && m.sender !== userId && !m.isRead)
        .forEach(m => {
          m.isRead = true;
          m.readAt = new Date();
        });

      res.json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
      });
    }
  },

  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;

      const message = mockMessages.get(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      if (message.sender !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }

      message.isDeleted = true;
      message.deletedAt = new Date();

      res.json({
        success: true,
        message: 'Message deleted',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete message',
      });
    }
  },

  getUnreadCount: async (req, res) => {
    try {
      const userId = req.user.userId;

      const conversationIds = Array.from(mockConversations.values())
        .filter(c => c.participants.includes(userId))
        .map(c => c._id);

      const unreadCount = Array.from(mockMessages.values())
        .filter(m => conversationIds.includes(m.conversation) && m.sender !== userId && !m.isRead)
        .length;

      res.json({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
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

  // Message routes
  app.post('/api/messages/conversations', authenticate, mockMessageController.getOrCreateConversation);
  app.get('/api/messages/conversations', authenticate, mockMessageController.getConversations);
  app.get('/api/messages/:conversationId', authenticate, mockMessageController.getMessages);
  app.post('/api/messages/:conversationId', authenticate, mockMessageController.sendMessage);
  app.put('/api/messages/:conversationId/read', authenticate, mockMessageController.markAsRead);
  app.delete('/api/messages/:messageId', authenticate, mockMessageController.deleteMessage);
  app.get('/api/messages/unread/count', authenticate, mockMessageController.getUnreadCount);

  return app;
};

describe('Messaging API Tests', () => {
  let app;
  let user1;
  let user2;
  let token1;
  let token2;

  beforeEach(() => {
    app = createTestApp();
    mockUsers.clear();
    mockConversations.clear();
    mockMessages.clear();

    user1 = createMockUser('student');
    user2 = createMockUser('creator');
    token1 = createToken(user1._id, 'student');
    token2 = createToken(user2._id, 'creator');
  });

  describe('POST /api/messages/conversations', () => {
    it('should create new conversation', async () => {
      const response = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversation._id).toBeDefined();
      expect(response.body.data.conversation.participants.length).toBe(2);
    });

    it('should return existing conversation', async () => {
      // Create conversation first
      await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      // Get same conversation
      const response = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token2}`)
        .send({ userId: user1._id })
        .expect(200);

      expect(response.body.data.conversation._id).toBeDefined();
    });

    it('should reject conversation with non-existent user', async () => {
      const response = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: 'nonexistent_user_id' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('GET /api/messages/conversations', () => {
    it('should return empty list for new user', async () => {
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversations).toEqual([]);
    });

    it('should return user conversations', async () => {
      // Create conversation
      const convRes = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.conversations.length).toBe(1);
      expect(response.body.data.conversations[0].otherParticipant.username).toBe(user2.username);
    });

    it('should include unread count', async () => {
      // Create conversation
      const convRes = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      const conversationId = convRes.body.data.conversation._id;

      // Send message from user2
      await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Hello from user2' })
        .expect(201);

      // Check unread count
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.conversations[0].unreadCount).toBe(1);
    });
  });

  describe('GET /api/messages/:conversationId', () => {
    let conversationId;

    beforeEach(async () => {
      const convRes = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      conversationId = convRes.body.data.conversation._id;
    });

    it('should return messages in conversation', async () => {
      // Send some messages
      await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Message 1' })
        .expect(201);

      await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Message 2' })
        .expect(201);

      const response = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.messages.length).toBe(2);
      // Messages should be in chronological order
      expect(response.body.data.messages[0].content).toBe('Message 1');
      expect(response.body.data.messages[1].content).toBe('Message 2');
    });

    it('should reject unauthorized access', async () => {
      const otherUser = createMockUser('student');
      const otherToken = createToken(otherUser._id, 'student');

      const response = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should paginate messages', async () => {
      // Send 10 messages
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post(`/api/messages/${conversationId}`)
          .set('Authorization', `Bearer ${token1}`)
          .send({ content: `Message ${i}` })
          .expect(201);
      }

      const response = await request(app)
        .get(`/api/messages/${conversationId}?page=1&limit=5`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.messages.length).toBe(5);
      expect(response.body.data.pagination.total).toBe(10);
      expect(response.body.data.pagination.pages).toBe(2);
    });
  });

  describe('POST /api/messages/:conversationId', () => {
    let conversationId;

    beforeEach(async () => {
      const convRes = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      conversationId = convRes.body.data.conversation._id;
    });

    it('should send text message', async () => {
      const response = await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Hello, this is a test message!' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe('Hello, this is a test message!');
      expect(response.body.data.message.messageType).toBe('text');
    });

    it('should send message with media type', async () => {
      const response = await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ 
          content: 'Check out this image',
          messageType: 'image',
          media: [{ type: 'image', url: 'https://example.com/image.jpg' }]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.messageType).toBe('image');
      expect(response.body.data.message.media.length).toBe(1);
    });

    it('should reject sending to non-participant', async () => {
      const otherUser = createMockUser('student');
      const otherToken = createToken(otherUser._id, 'student');

      const response = await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Hacked message!' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/messages/:conversationId/read', () => {
    let conversationId;

    beforeEach(async () => {
      const convRes = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      conversationId = convRes.body.data.conversation._id;

      // Send messages from user2
      await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'Unread message' })
        .expect(201);
    });

    it('should mark messages as read', async () => {
      const response = await request(app)
        .put(`/api/messages/${conversationId}/read`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Messages marked as read');
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    let conversationId;
    let messageId;

    beforeEach(async () => {
      const convRes = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      conversationId = convRes.body.data.conversation._id;

      const msgRes = await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Message to delete' })
        .expect(201);

      messageId = msgRes.body.data.message._id;
    });

    it('should delete own message', async () => {
      const response = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message deleted');
    });

    it('should reject deleting other user message', async () => {
      const msgRes = await request(app)
        .post(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ content: 'User2 message' })
        .expect(201);

      const user2MessageId = msgRes.body.data.message._id;

      const response = await request(app)
        .delete(`/api/messages/${user2MessageId}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .delete('/api/messages/nonexistent_message_id')
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/messages/unread/count', () => {
    it('should return zero for new user', async () => {
      const response = await request(app)
        .get('/api/messages/unread/count')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBe(0);
    });

    it('should return correct unread count', async () => {
      // Create conversation
      const convRes = await request(app)
        .post('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id })
        .expect(200);

      const conversationId = convRes.body.data.conversation._id;

      // Send 3 messages from user2
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/messages/${conversationId}`)
          .set('Authorization', `Bearer ${token2}`)
          .send({ content: `Message ${i}` })
          .expect(201);
      }

      const response = await request(app)
        .get('/api/messages/unread/count')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.unreadCount).toBe(3);
    });
  });
});

