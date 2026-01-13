const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

exports.getBalance = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.userId });

    if (!wallet) {
      wallet = new Wallet({ user: req.user.userId, balance: 0 });
      await wallet.save();
    }

    res.json({
      success: true,
      data: { balance: wallet.balance },
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addFunds = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    let wallet = await Wallet.findOne({ user: req.user.userId });

    if (!wallet) {
      wallet = new Wallet({ user: req.user.userId, balance: 0 });
    }

    wallet.balance += parseFloat(amount);
    await wallet.save();

    const transaction = new Transaction({
      user: req.user.userId,
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'completed',
      description: 'Added funds',
    });
    await transaction.save();

    res.json({
      success: true,
      data: { wallet, transaction },
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    let wallet = await Wallet.findOne({ user: req.user.userId });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    wallet.balance -= parseFloat(amount);
    await wallet.save();

    const transaction = new Transaction({
      user: req.user.userId,
      type: 'withdrawal',
      amount: parseFloat(amount),
      status: 'pending',
      description: 'Withdrawal to bank',
    });
    await transaction.save();

    res.json({
      success: true,
      data: { wallet, transaction },
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
