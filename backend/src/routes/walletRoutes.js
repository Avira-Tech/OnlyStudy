const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

router.get('/balance', authenticate, walletController.getBalance);
router.get('/transactions', authenticate, walletController.getTransactions);
router.post('/add-funds', authenticate, walletController.addFunds);
router.post('/withdraw', authenticate, walletController.withdraw);

module.exports = router;

