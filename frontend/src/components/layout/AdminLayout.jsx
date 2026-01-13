
import { useState } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { Menu, X, Home, Users, Video, DollarSign, Flag, BarChart2, Settings, LogOut, Shield, Bell, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Creators', href: '/admin/creators', icon: Video },
    { name: 'Content', href: '/admin/content', icon: BarChart2 },
    { name: 'Live Streams', href: '/admin/livestreams', icon: Video },
    { name: 'Transactions', href: '/admin/transactions', icon: DollarSign },
    { name: 'Reports', href: '/admin/reports', icon: Flag },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-border transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-accent" />
              <span className="text-xl font-bold text-text-primary">Admin</span>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-text-muted hover:text-text-primary">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link key={item.name} to={item.href} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}>
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <img src={user?.avatar || '/default-avatar.png'} alt={user?.username} className="h-10 w-10 rounded-full bg-bg-tertiary object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.username}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-bg-secondary border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-text-muted hover:text-text-primary">
                <Menu className="h-6 w-6" />
              </button>
              <Link to="/" className="text-xl font-bold text-accent lg:hidden">OnlyStudy</Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-text-muted hover:text-text-primary transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full"></span>
              </button>
              <div className="relative">
                <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center space-x-2 p-1 rounded-lg hover:bg-bg-hover transition-colors">
                  <img src={user?.avatar || '/default-avatar.png'} alt={user?.username} className="h-8 w-8 rounded-full bg-bg-tertiary object-cover" />
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-bg-card border border-border rounded-lg shadow-of-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-text-primary">{user?.username}</p>
                      <p className="text-xs text-text-muted">Admin</p>
                    </div>
                    <Link to="/admin/settings" className="flex items-center space-x-3 px-4 py-2 text-text-secondary hover:bg-bg-hover transition-colors" onClick={() => setIsProfileDropdownOpen(false)}>
                      <Settings className="h-4 w-4" /><span>Settings</span>
                    </Link>
                    <Link to="/" className="flex items-center space-x-3 px-4 py-2 text-text-secondary hover:bg-bg-hover transition-colors" onClick={() => setIsProfileDropdownOpen(false)}>
                      <Home className="h-4 w-4" /><span>View Site</span>
                    </Link>
                    <div className="border-t border-border mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-2 text-error hover:bg-bg-hover w-full transition-colors">
                        <LogOut className="h-4 w-4" /><span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto"><Outlet /></main>
      </div>
      {isSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  )
}

export default AdminLayout

