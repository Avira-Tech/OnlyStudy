import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'
import { Heart, MessageCircle, Share, Star, Users, Calendar, MapPin, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const CreatorProfile = () => {
  const { username } = useParams()
  const { user } = useAuthStore()
  const [creator, setCreator] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    fetchCreatorProfile()
    fetchCreatorPosts()
  }, [username])

  const fetchCreatorProfile = async () => {
    try {
      const res = await api.get(`/users/creator/${username}`)
      setCreator(res.data.data.creator)
      setIsSubscribed(res.data.data.isSubscribed)
    } catch (error) {
      console.error('Failed to fetch creator:', error)
      toast.error('Failed to load creator profile')
    }
  }

  const fetchCreatorPosts = async () => {
    try {
      const res = await api.get(`/posts/creator/${username}`)
      setPosts(res.data.data.posts || [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      // Don't show error for posts, just set empty array
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Please login to subscribe')
      return
    }

    setSubscribing(true)
    try {
      await api.post('/subscriptions', {
        creatorId: creator._id,
        tier: 'basic'
      })
      setIsSubscribed(true)
      toast.success('Successfully subscribed!')
    } catch (error) {
      console.error('Subscription error:', error)
      toast.error('Failed to subscribe')
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Creator not found</h1>
          <Link to="/explore" className="text-accent hover:underline">
            Browse other creators
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Banner */}
      <div
        className="h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${creator.banner || '/default-banner.png'})` }}
      >
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-bg-card rounded-lg border border-border overflow-hidden">
          {/* Avatar and Basic Info */}
          <div className="p-6 text-center">
            <img
              src={creator.avatar || '/default-avatar.png'}
              alt={creator.username}
              className="w-32 h-32 rounded-full mx-auto border-4 border-bg-card mb-4"
            />

            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-text-primary">{creator.username}</h1>
              {creator.isCreatorVerified && (
                <Star className="h-5 w-5 text-accent fill-current" />
              )}
            </div>

            {creator.about && (
              <p className="text-text-secondary mb-4 max-w-md mx-auto">{creator.about}</p>
            )}

            {/* Stats */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{creator.subscriberCount || 0}</div>
                <div className="text-sm text-text-muted">Fans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{creator.postCount || 0}</div>
                <div className="text-sm text-text-muted">Posts</div>
              </div>
            </div>

            {/* Location */}
            {creator.location && (
              <div className="flex items-center justify-center gap-1 text-text-secondary mb-4">
                <MapPin className="h-4 w-4" />
                <span>{creator.location}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {!isSubscribed ? (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="bg-accent text-white px-8 py-3 rounded-lg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              ) : (
                <button className="bg-accent text-white px-8 py-3 rounded-lg font-medium">
                  Subscribed
                </button>
              )}

              <button className="border border-border bg-bg-secondary text-text-primary px-6 py-3 rounded-lg font-medium hover:bg-bg-hover transition-colors">
                <MessageCircle className="h-5 w-5 inline mr-2" />
                Message
              </button>

              <button className="border border-border bg-bg-secondary text-text-primary p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <Share className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Subscription Tiers */}
          {creator.subscriptionTiers && creator.subscriptionTiers.length > 0 && (
            <div className="border-t border-border p-6">
              <h2 className="text-xl font-bold mb-4">Subscription Tiers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {creator.subscriptionTiers.map((tier, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{tier.name}</h3>
                    <div className="text-2xl font-bold text-accent mb-2">${tier.price}/mo</div>
                    <p className="text-sm text-text-secondary mb-4">{tier.description}</p>
                    <button className="w-full bg-accent text-white py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
                      Subscribe to {tier.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          <div className="border-t border-border p-6">
            <h2 className="text-xl font-bold mb-4">Recent Posts</h2>
            {posts.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No posts yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.slice(0, 6).map((post) => (
                  <div key={post._id} className="border border-border rounded-lg overflow-hidden">
                    {post.media && post.media.length > 0 && (
                      <img
                        src={post.media[0].url}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{post.title}</h3>
                      <p className="text-sm text-text-secondary line-clamp-2">{post.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-text-muted">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-text-muted">
                          <Heart className="h-4 w-4" />
                          {post.likes || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatorProfile
