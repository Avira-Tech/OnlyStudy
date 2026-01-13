
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Users, Search, Filter, Mail, MoreVertical, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CreatorSubscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => { fetchSubscribers() }, [filter, pagination.page]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/subscriptions/creator/subscribers?status=${filter}&page=${pagination.page}&limit=20`);
      setSubscribers(res.data.data.subscribers || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.data.total || 0,
        pages: res.data.data.pagination?.pages || 1
      }));
    } catch (error) {
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => 
    sub.subscriber?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTierBadge = (tier) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-700',
      premium: 'bg-yellow-100 text-yellow-700',
      vip: 'bg-purple-100 text-purple-700'
    };
    return colors[tier] || colors.basic;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Subscribers</h1>
          <p className="text-text-secondary">Manage and view your subscribers</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="bg-bg-card px-4 py-2 rounded-lg border border-border">
            <span className="text-sm text-text-muted">Total: </span>
            <span className="font-semibold text-text-primary">{pagination.total}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Active Subscribers</p>
              <p className="text-2xl font-bold text-text-primary">
                {subscribers.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">New This Month</p>
              <p className="text-2xl font-bold text-text-primary">+5</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Churn Rate</p>
              <p className="text-2xl font-bold text-text-primary">2.3%</p>
            </div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-text-secondary" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search subscribers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'active', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => { setFilter(status); setPagination(prev => ({ ...prev, page: 1 })); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === status
                    ? 'bg-accent text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-bg-card rounded-lg border border-border">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No subscribers found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSubscribers.map((subscription) => (
              <div key={subscription._id} className="p-4 flex items-center justify-between hover:bg-bg-hover/50 transition-colors">
                <div className="flex items-center gap-4">
                  <img
                    src={subscription.subscriber?.avatar || '/default-avatar.png'}
                    alt={subscription.subscriber?.username}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <Link 
                      to={`/creator/${subscription.subscriber?.username}`}
                      className="font-medium text-text-primary hover:text-accent"
                    >
                      {subscription.subscriber?.username || 'Unknown User'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getTierBadge(subscription.tier)}`}>
                        {subscription.tier || 'basic'}
                      </span>
                      <span className="text-xs text-text-muted">
                        Subscribed {formatDate(subscription.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-sm ${
                    subscription.status === 'active' ? 'text-success' : 'text-text-muted'
                  }`}>
                    {subscription.status === 'active' ? 'Active' : subscription.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                      <Mail className="h-4 w-4 text-text-secondary" />
                    </button>
                    <button className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4 text-text-secondary" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-bg-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-hover"
            >
              Previous
            </button>
            <span className="text-sm text-text-secondary">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 bg-bg-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-hover"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorSubscribers;

