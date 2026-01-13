
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'
import { DollarSign, Users, Eye, TrendingUp, Video, FileText, Plus, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const CreatorDashboard = () => {
  const [stats, setStats] = useState({ totalEarnings: 0, subscriberCount: 0, totalViews: 0, postCount: 0 })
  const [loading, setLoading] = useState(true)
  const [recentPosts, setRecentPosts] = useState([])
  const { user } = useAuthStore()

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, postsRes] = await Promise.all([
        api.get('/subscriptions/creator/stats'),
        api.get(`/posts/creator/${user?.username}?limit=5`),
      ])
      // Stats endpoint returns { totalSubscribers, monthlyEarnings }
      const statsData = statsRes.data.data || {}
      setStats({
        totalEarnings: statsData.monthlyEarnings || 0,
        subscriberCount: statsData.totalSubscribers || 0,
        totalViews: 0, // Not available in current stats endpoint
        postCount: 0,  // Will need separate endpoint or count
      })
      // Posts endpoint returns { posts: [...] }
      setRecentPosts(postsRes.data.data?.posts || [])
    } catch (error) { toast.error('Failed to load dashboard') } finally { setLoading(false) }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Creator Dashboard</h1>
          <p className="text-text-secondary">Welcome back, {user?.username}</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Link to="/creator/new-post" className="bg-accent text-white px-4 py-2 rounded-full hover:bg-accent-hover transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Post
          </Link>
          <Link to="/creator/live" className="bg-bg-tertiary text-text-primary px-4 py-2 rounded-full border border-border hover:bg-bg-hover transition-colors flex items-center gap-2">
            <Video className="h-4 w-4" /> Go Live
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-text-muted">Total Earnings</p><p className="text-2xl font-bold text-text-primary">${stats.totalEarnings?.toLocaleString() || 0}</p></div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center"><DollarSign className="h-6 w-6 text-accent" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-success"><TrendingUp className="h-4 w-4 mr-1" /><span>+15% this month</span></div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-text-muted">Subscribers</p><p className="text-2xl font-bold text-text-primary">{stats.subscriberCount?.toLocaleString() || 0}</p></div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center"><Users className="h-6 w-6 text-accent" /></div>
          </div>
          <div className="mt-4 text-sm text-text-secondary"><span>+5 new this week</span></div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-text-muted">Total Views</p><p className="text-2xl font-bold text-text-primary">{stats.totalViews?.toLocaleString() || 0}</p></div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center"><Eye className="h-6 w-6 text-accent" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-success"><TrendingUp className="h-4 w-4 mr-1" /><span>+22% this month</span></div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-text-muted">Posts</p><p className="text-2xl font-bold text-text-primary">{stats.postCount || 0}</p></div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center"><FileText className="h-6 w-6 text-accent" /></div>
          </div>
          <div className="mt-4 text-sm text-text-secondary"><span>Keep posting!</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Recent Posts</h2>
            <Link to="/creator/posts" className="text-sm text-accent hover:text-accent-hover">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {recentPosts.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <FileText className="h-12 w-12 mx-auto mb-3 text-text-muted" />
                <p>No posts yet</p>
                <Link to="/creator/new-post" className="text-accent hover:text-accent-hover">Create your first post</Link>
              </div>
            ) : (
              recentPosts.map((post, index) => (
                <div key={post._id || index} className="p-4 flex items-center space-x-4">
                  <div className="h-16 w-16 bg-bg-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                    {post.media?.[0]?.type === 'image' ? (
                      <img src={post.media[0].url} alt="" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <Video className="h-6 w-6 text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{post.title || 'Untitled Post'}</p>
                    <p className="text-sm text-text-muted truncate">{post.content?.substring(0, 60)}...</p>
                    <div className="flex items-center mt-1 text-xs text-text-muted">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-text-muted">
                    <span className="flex items-center"><Eye className="h-4 w-4 mr-1" />{post.views || 0}</span>
                    <span className="flex items-center"><Users className="h-4 w-4 mr-1" />{post.likes?.length || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/creator/new-post" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="h-10 w-10 bg-bg-tertiary rounded-lg flex items-center justify-center"><Plus className="h-5 w-5 text-accent" /></div>
                <span className="text-text-primary">Create New Post</span>
              </Link>
              <Link to="/creator/live" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="h-10 w-10 bg-bg-tertiary rounded-lg flex items-center justify-center"><Video className="h-5 w-5 text-error" /></div>
                <span className="text-text-primary">Start Live Stream</span>
              </Link>
              <Link to="/creator/settings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="h-10 w-10 bg-bg-tertiary rounded-lg flex items-center justify-center"><Users className="h-5 w-5 text-accent" /></div>
                <span className="text-text-primary">Edit Profile</span>
              </Link>
              <Link to="/creator/earnings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className="h-10 w-10 bg-bg-tertiary rounded-lg flex items-center justify-center"><DollarSign className="h-5 w-5 text-success" /></div>
                <span className="text-text-primary">View Earnings</span>
              </Link>
            </div>
          </div>

          <div className="bg-bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-text-primary mb-4">Tips</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start"><span className="text-accent mr-2">•</span>Post regularly to keep subscribers engaged</li>
              <li className="flex items-start"><span className="text-accent mr-2">•</span>Use high-quality images and videos</li>
              <li className="flex items-start"><span className="text-accent mr-2">•</span>Interact with your audience in comments</li>
              <li className="flex items-start"><span className="text-accent mr-2">•</span>Go live to build stronger connections</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreatorDashboard

