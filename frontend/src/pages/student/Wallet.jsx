import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { 
  Wallet, DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft,
  History, Plus, Minus, TrendingUp, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const WalletPage = () => {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions'),
      ]);
      setBalance(balanceRes.data.data.balance);
      setTransactions(transactionsRes.data.data.transactions);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      toast.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/wallet/add-funds', { amount: parseFloat(amount) });
      setBalance(prev => prev + parseFloat(amount));
      setTransactions([{
        _id: Date.now().toString(),
        type: 'deposit',
        amount: parseFloat(amount),
        status: 'completed',
        createdAt: new Date().toISOString(),
        description: 'Added funds',
      }, ...transactions]);
      toast.success(`$${amount} added to your wallet!`);
      setAmount('');
    } catch (error) {
      toast.error('Failed to add funds');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance) {
      toast.error('Invalid amount');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/wallet/withdraw', { amount: parseFloat(amount) });
      setBalance(prev => prev - parseFloat(amount));
      toast.success('Withdrawal request submitted');
      setAmount('');
    } catch (error) {
      toast.error('Failed to process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'withdrawal': return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'tip': return <DollarSign className="w-5 h-5 text-blue-500" />;
      default: return <History className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-text-secondary">Manage your funds</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-accent to-accent-hover rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/80">Available Balance</span>
          <Wallet className="w-6 h-6 text-white/80" />
        </div>
        <div className="text-4xl font-bold mb-2">${balance.toFixed(2)}</div>
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>Your funds are secure</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="font-medium mb-3">Add Funds</h3>
          <div className="flex gap-2 mb-3">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  amount === amt.toString() ? 'bg-accent text-white' : 'bg-bg-secondary hover:bg-bg-hover'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom amount"
                className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleAddFunds}
              disabled={processing || !amount}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 flex items-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4">
          <h3 className="font-medium mb-3">Withdraw</h3>
          <p className="text-sm text-text-secondary mb-3">Withdraw to your bank account</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleWithdraw}
              disabled={processing || !amount || balance < parseFloat(amount || 0)}
              className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/80 disabled:opacity-50 flex items-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
              Withdraw
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-border mb-6">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'transactions', label: 'Transactions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg"><ArrowDownLeft className="w-5 h-5 text-green-600" /></div>
              <span className="text-text-secondary text-sm">Total Deposited</span>
            </div>
            <p className="text-2xl font-bold">${transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</p>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg"><ArrowUpRight className="w-5 h-5 text-red-600" /></div>
              <span className="text-text-secondary text-sm">Total Withdrawn</span>
            </div>
            <p className="text-2xl font-bold">${transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</p>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg"><DollarSign className="w-5 h-5 text-blue-600" /></div>
              <span className="text-text-secondary text-sm">Tips Sent</span>
            </div>
            <p className="text-2xl font-bold">${transactions.filter(t => t.type === 'tip').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</p>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-text-muted"><History className="w-12 h-12 mx-auto mb-2" /><p>No transactions yet</p></div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-4 hover:bg-bg-hover">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-bg-secondary rounded-lg">{getTransactionIcon(transaction.type)}</div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-text-muted">{format(new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'deposit' ? 'text-green-600' : 'text-text-primary'}`}>
                      {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </p>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">{transaction.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletPage;

