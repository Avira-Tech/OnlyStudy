const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const postRoutes = require('./postRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const messageRoutes = require('./messageRoutes');
const liveStreamRoutes = require('./liveStreamRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');
const uploadRoutes = require('./uploadRoutes');
const walletRoutes = require('./walletRoutes');
const earningsRoutes = require('./earningsRoutes');
const { handleUploadError } = require('../middleware/upload');

// Mount routes
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/messages', messageRoutes);
router.use('/streams', liveStreamRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/wallet', walletRoutes);
router.use('/creators/earnings', earningsRoutes);
router.use('/admin', adminRoutes);

// Multer error handling for post routes
router.use('/posts', handleUploadError);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;

