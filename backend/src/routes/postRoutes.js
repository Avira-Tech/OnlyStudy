const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadMedia } = require('../middleware/upload');

// Public routes
router.get('/feed', authenticate, postController.getFeed);
router.get('/creator/me', authenticate, postController.getMyPosts);
router.get('/creator/:username', optionalAuth, postController.getCreatorPosts);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);
router.get('/:postId', optionalAuth, postController.getPost);

// Protected routes
router.post('/', authenticate, uploadMedia, postController.createPost);
router.put('/:postId', authenticate, uploadMedia, postController.updatePost);
router.delete('/:postId', authenticate, postController.deletePost);
router.post('/:postId/like', authenticate, postController.likePost);
router.post('/:postId/unlock', authenticate, postController.unlockContent);
router.post('/:postId/report', authenticate, postController.reportPost);

module.exports = router;

