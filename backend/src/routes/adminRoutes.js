const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:userId/ban', adminController.toggleUserBan);
router.put('/users/:userId/verify', adminController.verifyCreator);

// Content management
router.get('/content', adminController.getContent);
router.delete('/content/:postId', adminController.deletePost);

// Reports
router.get('/reports', adminController.getReports);
router.put('/reports/:reportId/resolve', adminController.resolveReport);

// Transactions
router.get('/transactions', adminController.getTransactions);

// Live streams
router.get('/streams', adminController.getLiveStreams);
router.post('/streams/:streamId/end', adminController.endStream);

// Admin logs
router.get('/logs', adminController.getAdminLogs);

module.exports = router;

