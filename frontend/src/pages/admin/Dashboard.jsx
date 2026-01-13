import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'
import { Users, Video, DollarSign, TrendingUp, Flag, Settings, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalCreators: 0, totalRevenue: 0, pendingReports: 0, activeStreams: 0 })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const { user } = useAuthStore()

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/activity'),
        api.get('/admin/users?limit=5'),
      ])
      setStats(statsRes.data.data || {})
      setRecentActivity(activityRes.data.data?.activity || [])
      setRecentUsers(usersRes.data.data?.users || [])
    } catch (error) { toast.error('Failed to load dashboard') } finally { setLoading(false) }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-text-secondary">Welcome back, {user?.username}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-text-muted">Total Users</p><p className="text-2xl font-bold text-text-primary">{stats.totalUsers?.toLocaleString() || 0}</p></div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center"><Users className="h-6 w-6 text-accent" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-success"><TrendingUp className="h-4 w-4 mr-1" /><span>+12% from last month</span></div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-text-muted">Creators</p><p className="text-2xl font-bold text-text-primary">{stats.totalCreators?.toLocaleString() || 0}</p></div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center"><Video className="h-6 w-6 text-accent" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-text-secondary"><span>{stats.activeStreams || 0} currently streaming</span></div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-text-muted">Total Revenue</p><p className="text-2xl font-bold text-text-primary">${stats.totalRevenue?.toLocaleString() || 0}</p></div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center"><DollarSign className="h-6 w-6 text-accent" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm text-success"><TrendingUp className="h-4 w-4 mr-1" /><span>+8% from last month</span></div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-text-muted">Pending Reports</p><p className="text-2xl font-bold text-text-primary">{stats.pendingReports || 0}</p></div>
            <div className="h-12 w-12 bg-bg-tertiary rounded-lg flex items-center justify-center"><Flag className="h-6 w-6 text-error" /></div>
          </div>
          {stats.pendingReports > 0 && <div className="mt-4"><Link to="/admin/reports" className="text-sm text-accent hover:text-accent-hover">View reports →</Link></div>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/users" className="bg-bg-card rounded-lg border border-border p-4 hover:border-accent transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-bg-tertiary rounded-lg flex items-center justify-center group-hover:bg-accent transition-colors">
              <Users className="h-5 w-5 text-text-secondary group-hover:text-white transition-colors" />
            </div>
            <div><p className="font-medium text-text-primary">Manage Users</p><p className="text-sm text-text-muted">View & moderate</p></div>
          </div>
        </Link>
        <Link to="/admin/creators" className="bg-bg-card rounded-lg border border-border p-4 hover:border-accent transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-bg-tertiary rounded-lg flex items-center justify-center group-hover:bg-accent transition-colors">
              <Video className="h-5 w-5 text-text-secondary group-hover:text-white transition-colors" />
            </div>
            <div><p className="font-medium text-text-primary">Creators</p><p className="text-sm text-text-muted">Verify & manage</p></div>
          </div>
        </Link>
        <Link to="/admin/livestreams" className="bg-bg-card rounded-lg border border-border p-4 hover:border-accent transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-bg-tertiary rounded-lg flex items-center justify-center group-hover:bg-accent transition-colors">
              <Activity className="h-5 w-5 text-text-secondary group-hover:text-white transition-colors" />
            </div>
            <div><p className="font-medium text-text-primary">Live Streams</p><p className="text-sm text-text-muted">Monitor activity</p></div>
          </div>
        </Link>
        <Link to="/admin/settings" className="bg-bg-card rounded-lg border border-border p-4 hover:border-accent transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-bg-tertiary rounded-lg flex items-center justify-center group-hover:bg-accent transition-colors">
              <Settings className="h-5 w-5 text-text-secondary group-hover:text-white transition-colors" />
            </div>
            <div><p className="font-medium text-text-primary">Settings</p><p className="text-sm text-text-muted">Configure platform</p></div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border"><h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2></div>
          <div className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No recent activity</div>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="p-4 flex items-center space-x-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${activity.type === 'stream' ? 'bg-error bg-opacity-20' : 'bg-bg-tertiary'}`}>
                    {activity.type === 'stream' ? <Video className="h-4 w-4 text-error" /> : <Activity className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex-1"><p className="text-sm text-text-primary">{activity.message}</p><p className="text-xs text-text-muted">{activity.time}</p></div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">New Users</h2>
            <Link to="/admin/users" className="text-sm text-accent hover:text-accent-hover">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No new users</div>
            ) : (
              recentUsers.map((u, index) => (
                <div key={u._id || index} className="p-4 flex items-center space-x-3">
                  <img src={u.avatar || '/default-avatar.png'} alt={u.username} className="h-10 w-10 rounded-full bg-bg-tertiary object-cover" />
                  <div className="flex-1"><p className="text-sm font-medium text-text-primary">{u.username}</p><p className="text-xs text-text-muted">{u.email}</p></div>
                  <span className={`badge ${u.role === 'creator' ? 'badge-primary' : u.role === 'admin' ? 'badge-success' : 'badge-warning'}`}>{u.role}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

