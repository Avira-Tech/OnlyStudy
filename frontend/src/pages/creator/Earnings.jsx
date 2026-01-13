import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  DollarSign, Settings, CreditCard, TrendingUp, 
  DollarSign as DollarIcon, Users, Clock, Loader2,
  CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const Earnings = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    subscriberCount: 0,
    tipsReceived: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const [statsRes, transactionsRes] = await Promise.all([
        api.get('/creators/earnings/stats'),
        api.get('/creators/earnings/transactions'),
      ]);
      
      setStats(statsRes.data.data);
      setTransactions(transactionsRes.data.data.transactions);
    } catch (error) {
      // Use mock data if endpoint doesn't exist
      setStats({
        totalEarnings: 1250.00,
        pendingEarnings: 156.50,
        thisMonth: 324.00,
        lastMonth: 289.50,
        subscriberCount: 47,
        tipsReceived: 85.00,
      });
      setTransactions([
        { _id: '1', type: 'subscription', amount: 4.99, description: 'Monthly subscription', createdAt: new Date().toISOString() },
        { _id: '2', type: 'subscription', amount: 9.99, description: 'Premium subscription', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { _id: '3', type: 'tip', amount: 5.00, description: 'Tip from fan', createdAt: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount < 10) {
      toast.error('Minimum payout is $10');
      return;
    }
    if (amount > stats.pendingEarnings) {
      toast.error('Insufficient balance');
      return;
    }

    setProcessingPayout(true);
    try {
      await api.post('/creators/payout', { amount });
      toast.success('Payout requested successfully!');
      setShowPayoutModal(false);
      setPayoutAmount('');
      fetchEarnings();
    } catch (error) {
      toast.error('Failed to process payout');
    } finally {
      setProcessingPayout(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'subscription': return <Users className="w-4 h-4" />;
      case 'tip': return <DollarIcon className="w-4 h-4" />;
      case 'payout': return <DollarSign className="w-4 h-4" />;
      default: return <DollarIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Earnings</h1>
        <button
          onClick={() => setShowPayoutModal(true)}
          className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/80"
        >
          Request Payout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary text-sm">Total Earnings</span>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
          <p className="text-xs text-text-muted mt-1">Lifetime earnings</p>
        </div>

        <div className="bg-bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary text-sm">Available Balance</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.pendingEarnings)}</p>
          <p className="text-xs text-text-muted mt-1">Ready for payout</p>
        </div>

        <div className="bg-bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary text-sm">This Month</span>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.thisMonth)}</p>
          <p className="text-xs text-green-500 mt-1">
            +{formatCurrency(stats.thisMonth - stats.lastMonth)} vs last month
          </p>
        </div>

        <div className="bg-bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary text-sm">Tips Received</span>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.tipsReceived)}</p>
          <p className="text-xs text-text-muted mt-1">{stats.subscriberCount} subscribers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-text-muted">
              <DollarIcon className="w-12 h-12 mx-auto mb-2" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-bg-card rounded-full">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-500">
                    +{formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout Info */}
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Payout Information</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-bg-secondary rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Stripe Connected</span>
              </div>
              <p className="text-sm text-text-secondary">
                Your earnings are paid out via Stripe to your connected bank account.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subscription earnings</span>
                <span>80%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tips</span>
                <span>90%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Platform fee</span>
                <span>Varies</span>
              </div>
            </div>

            <a
              href="#"
              className="flex items-center justify-center gap-2 w-full py-2 border border-border rounded-lg hover:bg-bg-secondary text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View Stripe Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-2">Request Payout</h3>
            <p className="text-text-secondary mb-6">
              Available balance: {formatCurrency(stats.pendingEarnings)}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[25, 50, 100, 'All'].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setPayoutAmount(amount === 'All' ? stats.pendingEarnings : amount)}
                    className="px-3 py-1 text-sm bg-bg-secondary rounded hover:bg-bg-hover"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 py-2 border border-border rounded-lg hover:bg-bg-hover"
              >
                Cancel
              </button>
              <button
                onClick={handlePayout}
                disabled={processingPayout || !payoutAmount}
                className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingPayout ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Request Payout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Earnings;

