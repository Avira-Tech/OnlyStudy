const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.get('/conversations', messageController.getConversations);
router.post('/conversations', messageController.getOrCreateConversation);
router.put('/conversations/:conversationId/archive', messageController.archiveConversation);

// Message routes
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.post('/conversations/:conversationId/messages', messageController.sendMessage);
router.put('/conversations/:conversationId/read', messageController.markAsRead);
router.delete('/messages/:messageId', messageController.deleteMessage);

// Utility routes
router.get('/unread-count', messageController.getUnreadCount);

module.exports = router;

