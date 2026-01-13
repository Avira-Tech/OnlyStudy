import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import { useEffect } from 'react'

// Layout Components
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'

// Public Pages
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Explore from './pages/explore/Explore'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'
import Pricing from './pages/Pricing'
import Contact from './pages/Contact'

// Student Pages
import StudentHome from './pages/student/Home'
import CreatorProfile from './pages/student/CreatorProfile'
import Subscriptions from './pages/student/Subscriptions'
import Messages from './pages/messaging/Messages'
import Notifications from './pages/student/Notifications'
import Wallet from './pages/student/Wallet'
import Settings from './pages/student/Settings'
import LiveStream from './pages/live/LiveStream'

// Creator Pages
import CreatorDashboard from './pages/creator/Dashboard'
import CreatorPosts from './pages/creator/Posts'
import CreatorNewPost from './pages/creator/NewPost'
import CreatorSubscribers from './pages/creator/Subscribers'
import CreatorEarnings from './pages/creator/Earnings'
import CreatorSettings from './pages/creator/Settings'
import CreatorLive from './pages/creator/Live'

// Admin Pages
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminCreators from './pages/admin/Creators'
import AdminContent from './pages/admin/Content'
import AdminLiveStreams from './pages/admin/LiveStreams'
import AdminReports from './pages/admin/Reports'
import AdminTransactions from './pages/admin/Transactions'
import AdminAnalytics from './pages/admin/Analytics'
import AdminSettings from './pages/admin/Settings'

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      {/* Student Routes */}
      <Route path="/home" element={
        <ProtectedRoute roles={['student']}>
          <Layout>
            <StudentHome />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator/:username" element={
        <Layout>
          <CreatorProfile />
        </Layout>
      } />
      <Route path="/subscriptions" element={
        <ProtectedRoute roles={['student']}>
          <Layout>
            <Subscriptions />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute roles={['student', 'creator']}>
          <Layout>
            <Messages />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute roles={['student', 'creator']}>
          <Layout>
            <Notifications />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute roles={['student', 'creator']}>
          <Layout>
            <Wallet />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute roles={['student', 'creator']}>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/live/:streamId" element={
        <ProtectedRoute roles={['student', 'creator']}>
          <Layout>
            <LiveStream />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Creator Routes */}
      <Route path="/creator/dashboard" element={
        <ProtectedRoute roles={['creator']}>
          <Layout>
            <CreatorDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator/posts" element={
        <ProtectedRoute roles={['creator']}>
          <Layout>
            <CreatorPosts />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator/new-post" element={
        <ProtectedRoute roles={['creator']}>
          <Layout>
            <CreatorNewPost />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator/subscribers" element={
        <ProtectedRoute roles={['creator']}>
          <Layout>
            <CreatorSubscribers />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator/earnings" element={
        <ProtectedRoute roles={['creator']}>
          <Layout>
            <CreatorEarnings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator/settings" element={
        <ProtectedRoute roles={['creator']}>
          <Layout>
            <CreatorSettings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator/live" element={
        <ProtectedRoute roles={['creator']}>
          <Layout>
            <CreatorLive />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <AdminRoute>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminLayout>
            <AdminUsers />
          </AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/creators" element={
        <AdminRoute>
          <AdminLayout>
            <AdminCreators />
          </AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/content" element={
        <AdminRoute>
          <AdminLayout>
            <AdminContent />
          </AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/livestreams" element={
        <AdminRoute>
          <AdminLayout>
            <AdminLiveStreams />
          </AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/reports" element={
        <AdminRoute>
          <AdminLayout>
            <AdminReports />
          </AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/transactions" element={
        <AdminRoute>
          <AdminLayout>
            <AdminTransactions />
          </AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/analytics" element={
        <AdminRoute>
          <AdminLayout>
            <AdminAnalytics />
          </AdminLayout>
        </AdminRoute>
      } />
      <Route path="/admin/settings" element={
        <AdminRoute>
          <AdminLayout>
            <AdminSettings />
          </AdminLayout>
        </AdminRoute>
      } />

      {/* 404 Route */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

export default App
