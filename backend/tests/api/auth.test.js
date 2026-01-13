/**
 * Authentication API Tests
 * 
 * Tests for user registration, login, logout, password reset,
 * token refresh, and protected route access.
 */

const request = require('supertest');
const express = require('express');

// Mock mongoose before requiring models
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    Schema: class Schema {
      constructor(definition, options) {
        this.definition = definition;
        this.options = options;
        this.methods = {};
        this.statics = {};
        this.virtuals = {};
        this.indexes = [];
        this.pre = jest.fn();
        this.post = jest.fn();
      }
      pre() { return this; }
      post() { return this; }
      index() { return this; }
      virtual() { 
        return {
          get: jest.fn(),
        };
      }
      set() { return this; }
    },
  };
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Create a mock User model
const mockUsers = new Map();

const mockUserModel = {
  findOne: jest.fn(async (query) => {
    if (query.$or) {
      for (const condition of query.$or) {
        const user = Array.from(mockUsers.values()).find(u => 
          u.email === condition.email || u.username === condition.username
        );
        if (user) return user;
      }
      return null;
    }
    return null;
  }),
  findById: jest.fn(async (id) => {
    return mockUsers.get(id.toString()) || null;
  }),
  findByIdAndUpdate: jest.fn(async (id, update, options) => {
    const user = mockUsers.get(id.toString());
    if (user) {
      Object.assign(user, update);
      return user;
    }
    return null;
  }),
  create: jest.fn(async (data) => {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = {
      _id: id,
      ...data,
      password: hashedPassword,
      role: data.role || 'student',
      isVerified: false,
      isBanned: false,
      isCreatorVerified: false,
      avatar: '/uploads/avatars/default.png',
      banner: '/uploads/banners/default.png',
      bio: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUsers.set(id, user);
    return user;
  }),
};

// Mock models
jest.mock('../src/models', () => ({
  User: mockUserModel,
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Import routes after mocking
  const authRoutes = require('../src/routes/authRoutes');
  const { authenticate } = require('../src/middleware/auth');
  
  app.use('/api/auth', authRoutes);
  
  // Protected route for testing
  app.get('/api/protected', authenticate, (req, res) => {
    res.json({ success: true, user: req.user });
  });
  
  return app;
};

describe('Authentication API Tests', () => {
  let app;
  
  beforeEach(() => {
    // Clear mock data
    mockUsers.clear();
    jest.clearAllMocks();
    
    // Create fresh app for each test
    app = createTestApp();
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  describe('POST /api/auth/register', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
      role: 'student',
    };
    
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.username).toBe(validUserData.username);
      expect(response.body.data.user.email).toBe(validUserData.email);
    });
    
    it('should register a creator user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, username: 'creatoruser', email: 'creator@example.com', role: 'creator' })
        .expect(201);
      
      expect(response.body.data.user.role).toBe('creator');
    });
    
    it('should reject registration with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);
      
      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, username: 'differentuser' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already registered');
    });
    
    it('should reject registration with existing username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);
      
      // Second registration with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, email: 'different@example.com' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Username already taken');
    });
    
    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, email: 'invalid-email' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, password: 'short' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should reject registration without username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'SecurePass123!' })
        .expect(500);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/auth/login', () => {
    let registeredUser;
    const loginCredentials = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };
    
    beforeEach(async () => {
      // Register user first
      const response = await request(app)
        .post('/api/auth/register')
        .send(loginCredentials)
        .expect(201);
      
      registeredUser = response.body.data.user;
    });
    
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginCredentials)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(loginCredentials.email);
    });
    
    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ ...loginCredentials, password: 'WrongPassword123!' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
    
    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'AnyPassword123!' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });
  
  describe('POST /api/auth/refresh-token', () => {
    it('should generate new access token with valid refresh token', async () => {
      // Create a mock refresh token
      const userId = 'test_user_id';
      const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
        { expiresIn: '7d' }
      );
      
      // Mock user exists
      mockUserModel.findById.mockResolvedValueOnce({
        _id: userId,
        isBanned: false,
      });
      
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });
    
    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid_token' })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired refresh token');
    });
    
    it('should reject refresh token without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refresh token is required');
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
  
  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      // Mock user exists
      mockUserModel.findOne.mockResolvedValueOnce({
        _id: 'user123',
        email: 'test@example.com',
      });
      
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account exists');
    });
    
    it('should return success even for non-existent email (security)', async () => {
      mockUserModel.findOne.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Create a mock reset token hash
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Mock user with valid reset token
      mockUserModel.findOne.mockResolvedValueOnce({
        _id: 'user123',
        passwordResetToken: hashedToken,
        passwordResetExpires: Date.now() + 30 * 60 * 1000, // 30 minutes from now
        save: jest.fn().mockResolvedValue(true),
      });
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, newPassword: 'NewSecurePass456!' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successful');
    });
    
    it('should reject expired reset token', async () => {
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Mock user with expired reset token
      mockUserModel.findOne.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, newPassword: 'NewSecurePass456!' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });
  });
  
  describe('Protected Routes', () => {
    const protectedEndpoint = '/api/protected';
    
    it('should reject access without token', async () => {
      const response = await request(app)
        .get(protectedEndpoint)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });
    
    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get(protectedEndpoint)
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token.');
    });
    
    it('should reject access with malformed authorization header', async () => {
      const response = await request(app)
        .get(protectedEndpoint)
        .set('Authorization', 'NotBearer token')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should allow access with valid token', async () => {
      // Create a valid token
      const userId = 'user123';
      const token = jwt.sign(
        { userId, role: 'student' },
        process.env.JWT_ACCESS_SECRET || 'test_access_secret',
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get(protectedEndpoint)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBe(userId);
    });
  });
});

describe('JWT Token Tests', () => {
  describe('Token Generation', () => {
    it('should generate valid access token', () => {
      const userId = 'user123';
      const role = 'student';
      
      const token = jwt.sign(
        { userId, role },
        process.env.JWT_ACCESS_SECRET || 'test_access_secret',
        { expiresIn: '15m' }
      );
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || 'test_access_secret'
      );
      
      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe(role);
    });
    
    it('should generate valid refresh token', () => {
      const userId = 'user123';
      
      const token = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
        { expiresIn: '7d' }
      );
      
      expect(token).toBeDefined();
      
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'test_refresh_secret'
      );
      
      expect(decoded.userId).toBe(userId);
    });
    
    it('should reject expired access token', () => {
      const token = jwt.sign(
        { userId: 'user123', role: 'student' },
        process.env.JWT_ACCESS_SECRET || 'test_access_secret',
        { expiresIn: '-1s' } // Already expired
      );
      
      expect(() => {
        jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'test_access_secret');
      }).toThrow();
    });
    
    it('should reject token with invalid signature', () => {
      const token = jwt.sign(
        { userId: 'user123', role: 'student' },
        'wrong_secret',
        { expiresIn: '15m' }
      );
      
      expect(() => {
        jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'test_access_secret');
      }).toThrow();
    });
  });
});

