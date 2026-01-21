import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Home, Users, CreditCard, Building2, LogOut, Eye, Menu, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { useState, useEffect } from 'react'
import { getCurrentUser, getRoleDisplayName, isDemo } from '../lib/auth'

function Layout() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Cek apakah user sudah login
    const userData = localStorage.getItem('user')
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    
    if (!isLoggedIn || !userData) {
      window.location.href = '/login'
      return
    }
    
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    } else {
      handleLogout()
    }
  }, [])

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
      
      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, still clear local storage and redirect
      localStorage.removeItem('user')
      localStorage.removeItem('isLoggedIn')
      window.location.href = '/login'
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/properti', label: 'Properti', icon: Building2 },
    { path: '/penyewa', label: 'Penyewa', icon: Users },
    { path: '/pembayaran', label: 'Pembayaran', icon: CreditCard }
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Home className="w-4 lg:w-6 h-4 lg:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">KontrakanKu</h2>
                <p className="text-xs text-gray-500 hidden lg:block">Admin Panel</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when clicking menu
                className={cn(
                  'flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          {/* Demo User Banner */}
          {isDemo() && (
            <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-800">Mode Demo</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">Akses hanya baca</p>
            </div>
          )}
          
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className={cn(
              "w-8 lg:w-10 h-8 lg:h-10 rounded-full flex items-center justify-center",
              isDemo() 
                ? "bg-gradient-to-br from-orange-200 to-orange-300" 
                : "bg-gradient-to-br from-blue-200 to-blue-300"
            )}>
              <span className={cn(
                "font-semibold text-sm",
                isDemo() ? "text-orange-700" : "text-blue-700"
              )}>
                {user.nama?.substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate capitalize">
                {user.nama || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate">{getRoleDisplayName()}</div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded flex items-center justify-center">
                <Home className="w-3 h-3 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">KontrakanKu</h1>
            </div>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
