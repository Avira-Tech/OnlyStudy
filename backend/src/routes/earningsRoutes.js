const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');
const { authenticate, authorize } = require('../middleware/auth');

// router.get('/stats', authenticate, authorize('creator'), earningsController.getStats);
// router.get('/transactions', authenticate, authorize('creator'), earningsController.getTransactions);
// router.get('/payouts', authenticate, authorize('creator'), earningsController.getPayouts);
// router.post('/request-payout', authenticate, authorize('creator'), earningsController.requestPayout);


router.get('/stats', authenticate, authorize('creator'), earningsController.getEarningsStats);
router.get('/transactions', authenticate, authorize('creator'), earningsController.getTransactions);
router.get('/payouts', authenticate, authorize('creator'), earningsController.getPayoutHistory);
router.post('/request-payout', authenticate, authorize('creator'), earningsController.requestPayout);

module.exports = router;
