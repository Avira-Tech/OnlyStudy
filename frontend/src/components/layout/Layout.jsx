import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import {
  Home,
  Search,
  MessageCircle,
  Bell,
  Wallet,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
  TrendingUp,
  Users,
  DollarSign,
  Video,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`)
      setIsSidebarOpen(false)
    }
  }

  const commonNavigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Discover', href: '/explore', icon: Search },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Subscriptions', href: '/subscriptions', icon: Users },
    { name: 'Wallet', href: '/wallet', icon: Wallet }
  ]

  const creatorNavigation = [
    { name: 'Dashboard', href: '/creator/dashboard', icon: TrendingUp },
    { name: 'Content', href: '/creator/posts', icon: FileText },
    { name: 'Fans', href: '/creator/subscribers', icon: Users },
    { name: 'Earnings', href: '/creator/earnings', icon: DollarSign },
    { name: 'Live', href: '/creator/live', icon: Video },
    { name: 'Settings', href: '/creator/settings', icon: Settings }
  ]

  const getNavigation = () => {
    if (user?.role === 'creator') {
      return [...commonNavigation.filter(item => item.name !== 'Home'), ...creatorNavigation]
    }
    return commonNavigation
  }

  const navigation = getNavigation()

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="bg-bg-secondary border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-3xl font-bold text-accent">OnlyFans</Link>
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search creators, content..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-bg-tertiary border border-border"
                />
              </form>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map(item => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    title={item.name}
                    className={`p-2 rounded-full ${active ? 'text-accent bg-bg-tertiary' : 'text-text-secondary hover:bg-bg-hover'}`}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                )
              })}
              {user?.role === 'creator' && (
                <Link to="/creator/new-post" className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-full ml-2">
                  <Plus className="h-4 w-4" />Post
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="relative">
                  <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-bg-hover">
                    <img src={user?.avatar || '/default-avatar.png'} alt={user?.username} className="h-8 w-8 rounded-full object-cover" />
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-bg-card border border-border rounded-lg shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="font-medium">{user?.username}</p>
                        <p className="text-xs text-text-muted capitalize">{user?.role}</p>
                      </div>
                      <Link to={`/creator/${user?.username}`} className="flex items-center gap-3 px-4 py-2 hover:bg-bg-hover" onClick={() => setIsProfileDropdownOpen(false)}>
                        <User className="h-4 w-4" />View Profile
                      </Link>
                      {user?.role === 'creator' && (
                        <Link to="/creator/dashboard" className="flex items-center gap-3 px-4 py-2 hover:bg-bg-hover" onClick={() => setIsProfileDropdownOpen(false)}>
                          <TrendingUp className="h-4 w-4" />Creator Dashboard
                        </Link>
                      )}
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-bg-hover" onClick={() => setIsProfileDropdownOpen(false)}>
                        <Settings className="h-4 w-4" />Settings
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-error hover:bg-bg-hover w-full border-t">
                        <LogOut className="h-4 w-4" />Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login">Login</Link>
                  <Link to="/register" className="bg-accent text-white px-4 py-2 rounded-full">Sign Up</Link>
                </div>
              )}
              <button className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>{isSidebarOpen ? <X /> : <Menu />}</button>
            </div>
          </div>
        </div>
        {isSidebarOpen && (
          <div className="md:hidden border-t border-border">
            <form onSubmit={handleSearch} className="p-4">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search creators, content..." className="w-full px-4 py-2 border rounded-lg" />
            </form>
            <div className="px-2 pb-4 space-y-1">
              {navigation.map(item => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link key={item.name} to={item.href} onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active ? 'bg-accent/10 text-accent' : 'hover:bg-bg-hover'}`}>
                    <Icon className="h-5 w-5" />{item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

export default Layout

