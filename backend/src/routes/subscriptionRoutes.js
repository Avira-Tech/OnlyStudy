const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, subscriptionController.getMySubscriptions);
router.get('/check/:creatorId', authenticate, subscriptionController.checkSubscription);
router.get('/creator/subscribers', authenticate, subscriptionController.getSubscribers);
router.get('/creator/stats', authenticate, subscriptionController.getCreatorStats);
router.post('/', authenticate, subscriptionController.createSubscription);
router.post('/confirm', authenticate, subscriptionController.confirmSubscription);
router.post('/cancel/:subscriptionId', authenticate, subscriptionController.cancelSubscription);

module.exports = router;

