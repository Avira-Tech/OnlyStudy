import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { 
  UserPlus, CreditCard, Calendar, Check, X, 
  Crown, Star, Loader2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const Subscriptions = () => {
  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions');
      setSubscriptions(response.data.data.subscriptions);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this subscription?');
    if (!confirmed) return;

    setCancelling(subscriptionId);
    try {
      await api.post(`/subscriptions/${subscriptionId}/cancel`);
      setSubscriptions(subscriptions.map(sub => 
        sub._id === subscriptionId ? { ...sub, status: 'cancelled', autoRenew: false } : sub
      ));
      toast.success('Subscription cancelled');
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(null);
    }
  };

  const handleReactivate = async (subscriptionId) => {
    try {
      await api.post(`/subscriptions/${subscriptionId}/reactivate`);
      setSubscriptions(subscriptions.map(sub => 
        sub._id === subscriptionId ? { ...sub, status: 'active', autoRenew: true } : sub
      ));
      toast.success('Subscription reactivated');
    } catch (error) {
      toast.error('Failed to reactivate subscription');
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'vip': return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'premium': return <Star className="w-5 h-5 text-purple-500" />;
      default: return <Check className="w-5 h-5 text-green-500" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'vip': return 'bg-yellow-100 text-yellow-700';
      case 'premium': return 'bg-purple-100 text-purple-700';
      default: return 'bg-green-100 text-green-700';
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
          <h1 className="text-2xl font-bold">My Subscriptions</h1>
          <p className="text-text-secondary">
            {subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/explore"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80"
        >
          <UserPlus className="w-4 h-4" />
          Explore Creators
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-xl p-12 text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-text-muted" />
          <h3 className="text-xl font-medium mb-2">No subscriptions yet</h3>
          <p className="text-text-secondary mb-6">
            Subscribe to your favorite creators to access exclusive content
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/80"
          >
            Explore Creators
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <div
              key={subscription._id}
              className="bg-bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-start gap-6">
                <Link to={`/creator/${subscription.creator?.username}`}>
                  <img
                    src={subscription.creator?.avatar || '/default-avatar.png'}
                    alt={subscription.creator?.username}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </Link>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/creator/${subscription.creator?.username}`}
                      className="text-xl font-semibold hover:text-accent"
                    >
                      {subscription.creator?.username}
                    </Link>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(subscription.tier)}`}>
                      <span className="inline-flex items-center gap-1">
                        {getTierIcon(subscription.tier)}
                        <span className="ml-1 capitalize">{subscription.tier}</span>
                      </span>
                    </span>
                    {subscription.status !== 'active' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {subscription.status}
                      </span>
                    )}
                  </div>

                  <p className="text-text-secondary mb-4">
                    {subscription.creator?.bio}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Calendar className="w-4 h-4" />
                      Subscribed {new Date(subscription.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <CreditCard className="w-4 h-4" />
                      ${subscription.price}/month
                    </div>
                    {subscription.autoRenew && subscription.status === 'active' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-4 h-4" />
                        Auto-renew enabled
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {subscription.status === 'active' ? (
                    <>
                      {subscription.autoRenew ? (
                        <button
                          onClick={() => handleCancel(subscription._id)}
                          disabled={cancelling === subscription._id}
                          className="px-4 py-2 border border-border rounded-lg hover:bg-bg-hover disabled:opacity-50"
                        >
                          {cancelling === subscription._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(subscription._id)}
                          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80"
                        >
                          Reactivate
                        </button>
                      )}
                      <Link
                        to={`/creator/${subscription.creator?.username}`}
                        className="px-4 py-2 bg-bg-tertiary rounded-lg hover:bg-bg-hover text-center"
                      >
                        View Content
                      </Link>
                    </>
                  ) : (
                    <span className="px-4 py-2 text-text-muted text-center">
                      Expires {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;

