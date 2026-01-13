const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Wallet = require('../models/Wallet');
const User = require('../models/User');

exports.getEarningsStats = async (req, res) => {
  try {
    const creatorId = req.user.id;

    // Get all completed transactions for this creator
    const transactions = await Transaction.find({
      user: creatorId,
      status: 'completed',
    });

    const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate this month's earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthTransactions = transactions.filter(
      (t) => new Date(t.createdAt) >= startOfMonth
    );
    const thisMonth = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    const lastMonthTransactions = transactions.filter(
      (t) => new Date(t.createdAt) >= startOfLastMonth && new Date(t.createdAt) < startOfMonth
    );
    const lastMonth = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Get pending earnings (withdrawals that are pending)
    const pendingWithdrawals = await Transaction.find({
      user: creatorId,
      type: 'withdrawal',
      status: 'pending',
    });
    const pendingEarnings = pendingWithdrawals.reduce((sum, t) => sum + t.amount, 0);

    // Get subscriber count
    const subscriberCount = await Subscription.countDocuments({
      creator: creatorId,
      status: 'active',
    });

    // Get tips
    const tips = transactions
      .filter((t) => t.type === 'tip')
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        totalEarnings,
        pendingEarnings,
        thisMonth,
        lastMonth,
        subscriberCount,
        tipsReceived: tips,
      },
    });
  } catch (error) {
    console.error('Get earnings stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    let query = { user: req.user.id };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.requestPayout = async (req, res) => {
  try {
    const { amount } = req.body;
    const creatorId = req.user.id;

    if (!amount || amount < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum payout amount is $10' 
      });
    }

    // Check wallet balance
    let wallet = await Wallet.findOne({ user: creatorId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Create payout transaction
    const transaction = new Transaction({
      user: creatorId,
      type: 'payout',
      amount: -amount,
      status: 'pending',
      description: 'Payout request',
    });
    await transaction.save();

    // Update wallet
    wallet.balance -= amount;
    await wallet.save();

    res.json({
      success: true,
      data: { transaction },
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getPayoutHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user.id,
      type: 'payout',
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

