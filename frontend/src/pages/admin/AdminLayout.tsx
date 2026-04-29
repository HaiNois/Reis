import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { Menu, X, ChevronRight } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

const navItems = [
  { path: '/admin', label: 'admin.dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/admin/products', label: 'admin.products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { path: '/admin/categories', label: 'admin.categories', icon: 'M4 6h16M4 12h16M4 18h16' },
  { path: '/admin/collections', label: 'admin.collections', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { path: '/admin/orders', label: 'admin.orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { path: '/admin/users', label: 'admin.users', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 1a3 3 0 11-6 0 3 3 0 016 0z' },
  { path: '/admin/homepage-sections', label: 'admin.homepageSections', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { path: '/admin/feedback', label: 'admin.feedback', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { path: '/admin/announcement-bar', label: 'admin.announcementBar', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
]

// Build breadcrumbs from current path
function useBreadcrumbs() {
  const location = useLocation()
  const { t } = useTranslation()

  const pathSegments = location.pathname.split('/').filter(Boolean)
  if (pathSegments.length === 0) return []

  const breadcrumbs = [{ label: t('admin.dashboard'), path: '/admin' }]

  let currentPath = ''
  pathSegments.slice(1).forEach((segment) => {
    currentPath += `/${segment}`
    const navItem = navItems.find(item => item.path === currentPath)
    if (navItem) {
      breadcrumbs.push({ label: t(navItem.label), path: currentPath })
    }
  })

  return breadcrumbs
}

export default function AdminLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const breadcrumbs = useBreadcrumbs()

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } })
    } else if (user?.role !== 'ADMIN') {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, user, location.pathname, navigate])

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10 transition-colors duration-300 hover:bg-gray-50">
        <div className="mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <div className="transition-transform duration-300">
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </div>
              </button>
              <h1 className="text-xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={() => logout()}
                className="text-sm text-red-600 hover:text-red-800"
              >
                {t('header.logout')}
              </button>
            </div>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-gray-900">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.path} className="text-gray-500 hover:text-gray-900">
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`bg-white shadow min-h-screen transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-64 opacity-100 translate-x-0' : 'w-[86px] opacity-90 -translate-x-0'
          }`}
        >
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span
                      className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                        sidebarOpen ? 'max-w-48 opacity-100' : 'max-w-0 opacity-0'
                      }`}
                    >
                      {t(item.label)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 transition-all duration-300 ease-in-out">
          <Outlet />
        </main>
      </div>
    </div>
  )
} 
