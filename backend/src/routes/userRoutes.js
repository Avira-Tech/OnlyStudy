const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadAvatar, uploadBanner } = require('../middleware/upload');

router.put('/profile', authenticate, uploadAvatar, uploadBanner, userController.updateProfile);
router.put('/pricing', authenticate, userController.updatePricing);
router.put('/notifications', authenticate, userController.updateNotifications);
router.get('/search', userController.searchCreators);
router.get('/trending', userController.getTrendingCreators);
router.get('/recommended', optionalAuth, userController.getRecommendedCreators);
router.get('/categories', userController.getCategories);
router.get('/creator/:username', optionalAuth, userController.getCreatorProfile);
router.get('/:userId', optionalAuth, userController.getUserProfile);

module.exports = router;

