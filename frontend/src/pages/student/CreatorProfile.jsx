import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import PostCard from '../../components/explore/PostCard';
import { 
  Heart, MessageCircle, Video, MapPin, Link as LinkIcon,
  Calendar, Check, Crown, Star, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreatorProfile = () => {
  const { username } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [subscribeTier, setSubscribeTier] = useState('basic');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchCreator();
  }, [username]);

  const fetchCreator = async () => {
    try {
      const response = await api.get(`/users/creator/${username}`);
      const creatorData = response.data.data.creator;
      setCreator(creatorData);
      setIsSubscribed(response.data.data.isSubscribed || false);
      setSubscription(response.data.data.subscription || null);
      
      const postsResponse = await api.get(`/posts/creator/${username}`);
      setPosts(postsResponse.data.data.posts || []);
      
      const streamsResponse = await api.get('/streams', {
        params: { streamer: creatorData._id, status: 'live' }
      });
      setLiveStreams(streamsResponse.data.data.streams);
    } catch (error) {
      console.error('Failed to fetch creator:', error);
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe');
      return;
    }

    setSubscribing(true);
    try {
      const response = await api.post('/subscriptions', {
        creatorId: creator._id,
        tier: subscribeTier,
      });
      
      setIsSubscribed(true);
      setSubscription(response.data.data.subscription);
      setShowSubscribeModal(false);
      toast.success(`Successfully subscribed to ${creator.username}!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;

    const confirmed = window.confirm('Are you sure you want to unsubscribe?');
    if (!confirmed) return;

    try {
      await api.delete(`/subscriptions/${subscription._id}`);
      setIsSubscribed(false);
      setSubscription(null);
      toast.success('Unsubscribed successfully');
    } catch (error) {
      toast.error('Failed to unsubscribe');
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'vip': return <Crown className="w-4 h-4" />;
      case 'premium': return <Star className="w-4 h-4" />;
      default: return <Check className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Creator not found</h2>
        <Link to="/explore" className="text-accent hover:underline">
          Explore other creators
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div 
        className="h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${creator.banner || '/default-banner.png'})` }}
      >
        <div className="h-full bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <img
            src={creator.avatar || '/default-avatar.png'}
            alt={creator.username}
            className="w-40 h-40 rounded-full border-4 border-bg-card object-cover"
          />

          <div className="flex-1 pt-20 md:pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold">{creator.username}</h1>
                {creator.isVerified && (
                  <span className="inline-flex items-center gap-1 text-sm text-accent mt-1">
                    <Check className="w-4 h-4" />
                    Verified Creator
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isSubscribed ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleUnsubscribe}
                      className="px-6 py-2 border border-border rounded-lg hover:bg-bg-hover"
                    >
                      Subscribed
                    </button>
                    <Link
                      to="/messages"
                      className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/80"
                    >
                      Message
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSubscribeModal(true)}
                    className="px-8 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/80"
                  >
                    Subscribe
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-text-secondary mb-4">
              <span className="font-semibold text-text-primary">{creator.subscriberCount || 0} subscribers</span>
              <span>{creator.postCount || 0} posts</span>
              {creator.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {creator.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(creator.createdAt).toLocaleDateString()}
              </span>
            </div>

            {creator.bio && (
              <p className="text-text-secondary">{creator.bio}</p>
            )}

            {creator.website && (
              <a
                href={creator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:underline mt-2"
              >
                <LinkIcon className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>

        <div className="flex border-b border-border mt-8 mb-6">
          {[
            { id: 'posts', label: 'Posts', count: posts.length },
            { id: 'live', label: 'Live', count: liveStreams.length },
            { id: 'about', label: 'About' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 bg-bg-tertiary rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-text-muted">
                <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                <p>No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} onUpdate={fetchCreator} />
              ))
            )}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStreams.length === 0 ? (
              <div className="col-span-full text-center py-12 text-text-muted">
                <Video className="w-12 h-12 mx-auto mb-2" />
                <p>No live streams</p>
              </div>
            ) : (
              liveStreams.map((stream) => (
                <Link
                  key={stream._id}
                  to={`/live/${stream._id}`}
                  className="bg-bg-card border border-border rounded-lg overflow-hidden hover:border-accent transition-colors"
                >
                  <div className="aspect-video bg-black relative">
                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{stream.title}</h3>
                    <p className="text-sm text-text-secondary">{stream.viewerCount} watching</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-bg-card border border-border rounded-lg p-6 max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">About {creator.username}</h3>
            
            <div className="space-y-4">
              {creator.about && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Bio</h4>
                  <p>{creator.about}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Subscription Tiers</h4>
                <div className="space-y-3">
                  {creator.subscriptionTiers?.map((tier) => (
                    <div
                      key={tier.name}
                      className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTierIcon(tier.name)}
                        <div>
                          <p className="font-medium capitalize">{tier.name}</p>
                          <p className="text-sm text-text-secondary">{tier.description}</p>
                        </div>
                      </div>
                      <p className="font-semibold">${tier.price}/month</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Subscribe to {creator.username}</h3>
              <p className="text-text-secondary mb-6">Choose a subscription tier</p>

              <div className="space-y-3 mb-6">
                {creator.subscriptionTiers?.map((tier) => (
                  <button
                    key={tier.name}
                    onClick={() => setSubscribeTier(tier.name)}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      subscribeTier === tier.name
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:bg-bg-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTierIcon(tier.name)}
                        <div>
                          <p className="font-medium capitalize">{tier.name}</p>
                          <p className="text-sm text-text-secondary">{tier.description}</p>
                        </div>
                      </div>
                      <p className="font-semibold">${tier.price}/mo</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSubscribeModal(false)}
                  className="flex-1 py-2 border border-border rounded-lg hover:bg-bg-hover"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50"
                >
                  {subscribing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subscribing...
                    </span>
                  ) : (
                    `Subscribe - $${creator.subscriptionTiers?.find(t => t.name === subscribeTier)?.price || 0}/mo`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorProfile;

