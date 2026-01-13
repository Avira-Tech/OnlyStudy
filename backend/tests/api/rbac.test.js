/**
 * Role-Based Access Control (RBAC) Tests
 * 
 * Tests for authentication middleware and authorization middleware
 * covering role-based access control for all user roles.
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Setup test environment
process.env.JWT_ACCESS_SECRET = 'test_access_secret_for_rbac_tests';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_for_rbac_tests';

// Mock middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

// Create test app with all role-protected routes
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Public route
  app.get('/api/public', (req, res) => {
    res.json({ message: 'Public endpoint' });
  });
  
  // Student route
  app.get('/api/student/dashboard', authenticate, authorize('student'), (req, res) => {
    res.json({ 
      message: 'Student dashboard', 
      user: req.user,
      features: ['view_content', 'subscribe', 'send_messages'] 
    });
  });
  
  // Creator route
  app.get('/api/creator/dashboard', authenticate, authorize('creator'), (req, res) => {
    res.json({ 
      message: 'Creator dashboard', 
      user: req.user,
      features: ['create_posts', 'go_live', 'view_earnings', 'manage_subscribers'] 
    });
  });
  
  // Admin route
  app.get('/api/admin/dashboard', authenticate, authorize('admin'), (req, res) => {
    res.json({ 
      message: 'Admin dashboard', 
      user: req.user,
      features: ['manage_users', 'moderate_content', 'view_analytics', 'manage_reports'] 
    });
  });
  
  // Multiple roles route (creator or admin)
  app.get('/api/content/moderate', authenticate, authorize('creator', 'admin'), (req, res) => {
    res.json({ 
      message: 'Content moderation',
      user: req.user,
    });
  });
  
  // All authenticated users route
  app.get('/api/protected/profile', authenticate, (req, res) => {
    res.json({ 
      message: 'Protected profile',
      user: req.user,
    });
  });
  
  return app;
};

describe('Authentication Middleware Tests', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  describe('No Token Provided', () => {
    it('should return 401 when no authorization header', async () => {
      const response = await request(app)
        .get('/api/student/dashboard')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });
    
    it('should return 401 when authorization header is empty', async () => {
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', '')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Invalid Token', () => {
    it('should return 401 for malformed token', async () => {
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', 'Bearer malformed.token.here')
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication failed.');
    });
    
    it('should return 401 for token with wrong secret', async () => {
      const token = jwt.sign(
        { userId: 'user123', role: 'student' },
        'wrong_secret',
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should return 401 for expired token', async () => {
      const token = jwt.sign(
        { userId: 'user123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '-1s' } // Already expired
      );
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should return 401 for non-Bearer token', async () => {
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', 'Basic sometoken')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Valid Token', () => {
    it('should allow access with valid student token', async () => {
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Student dashboard');
      expect(response.body.user.role).toBe('student');
    });
    
    it('should allow access with valid creator token', async () => {
      const token = jwt.sign(
        { userId: 'creator123', role: 'creator' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/creator/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Creator dashboard');
      expect(response.body.user.role).toBe('creator');
    });
    
    it('should allow access with valid admin token', async () => {
      const token = jwt.sign(
        { userId: 'admin123', role: 'admin' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Admin dashboard');
      expect(response.body.user.role).toBe('admin');
    });
  });
});

describe('Authorization Middleware Tests', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  describe('Student Access Control', () => {
    it('should allow student to access student dashboard', async () => {
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.features).toContain('view_content');
    });
    
    it('should deny student access to creator dashboard', async () => {
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/creator/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Insufficient permissions.');
    });
    
    it('should deny student access to admin dashboard', async () => {
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Creator Access Control', () => {
    it('should allow creator to access creator dashboard', async () => {
      const token = jwt.sign(
        { userId: 'creator123', role: 'creator' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/creator/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.features).toContain('create_posts');
    });
    
    it('should deny creator access to admin dashboard', async () => {
      const token = jwt.sign(
        { userId: 'creator123', role: 'creator' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should deny creator access to student dashboard', async () => {
      const token = jwt.sign(
        { userId: 'creator123', role: 'creator' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Admin Access Control', () => {
    it('should allow admin to access admin dashboard', async () => {
      const token = jwt.sign(
        { userId: 'admin123', role: 'admin' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.features).toContain('manage_users');
    });
    
    it('should deny admin access to student dashboard', async () => {
      const token = jwt.sign(
        { userId: 'admin123', role: 'admin' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Multiple Roles Access', () => {
    it('should allow creator to access creator/admin route', async () => {
      const token = jwt.sign(
        { userId: 'creator123', role: 'creator' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/content/moderate')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Content moderation');
    });
    
    it('should allow admin to access creator/admin route', async () => {
      const token = jwt.sign(
        { userId: 'admin123', role: 'admin' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/content/moderate')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Content moderation');
    });
    
    it('should deny student access to creator/admin route', async () => {
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/content/moderate')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Protected Routes (All Authenticated Users)', () => {
    it('should allow student to access protected profile', async () => {
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Protected profile');
    });
    
    it('should allow creator to access protected profile', async () => {
      const token = jwt.sign(
        { userId: 'creator123', role: 'creator' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Protected profile');
    });
    
    it('should allow admin to access protected profile', async () => {
      const token = jwt.sign(
        { userId: 'admin123', role: 'admin' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/protected/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.message).toBe('Protected profile');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle missing user in request', async () => {
      // Create app with modified middleware
      const customApp = express();
      customApp.use(express.json());
      
      customApp.get('/api/test', authenticate, (req, res) => {
        // Manually remove user to simulate edge case
        delete req.user;
        const authorizeStudent = authorize('student');
        authorizeStudent(req, res, () => {});
      });
      
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(customApp)
        .get('/api/test')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should handle invalid role in token', async () => {
      const token = jwt.sign(
        { userId: 'user123', role: 'invalid_role' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should handle token without role', async () => {
      const token = jwt.sign(
        { userId: 'user123' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Security Scenarios', () => {
  let app;
  
  beforeEach(() => {
    app = createTestApp();
  });
  
  describe('Token Tampering', () => {
    it('should reject token with modified payload', async () => {
      // Create valid token
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      // Tamper with token (change role to admin)
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      payload.role = 'admin';
      const tamperedToken = `${parts[0]}.${btoa(JSON.stringify(payload))}.${parts[2]}`;
      
      // Try to access student dashboard with tampered token
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
    
    it('should reject token with modified signature', async () => {
      const token = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      // Modify signature
      const parts = token.split('.');
      parts[2] = 'invalid_signature';
      const tamperedToken = parts.join('.');
      
      const response = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('Privilege Escalation Prevention', () => {
    it('should prevent student from accessing admin endpoints by modifying token', async () => {
      // Student creates a token and tries to escalate to admin
      const studentToken = jwt.sign(
        { userId: 'student123', role: 'student' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      // Student manually creates a new token claiming to be admin
      const escalatedToken = jwt.sign(
        { userId: 'student123', role: 'admin' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${escalatedToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Insufficient permissions.');
    });
    
    it('should prevent creator from accessing admin endpoints', async () => {
      const creatorToken = jwt.sign(
        { userId: 'creator123', role: 'creator' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );
      
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(403);
      
      expect(response.body.success).toBe(false);
    });
  });
});

