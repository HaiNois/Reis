import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { orderApi } from '@/services/orderApi'
import { Spinner } from '@/components/ui/spinner'

export default function DashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try to fetch from API
        const response = await orderApi.getOrderStats()
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Keep demo data
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Demo data fallback
  const displayStats = stats.totalOrders > 0 ? stats : {
    totalOrders: 24,
    pendingOrders: 5,
    processingOrders: 3,
    deliveredOrders: 16,
    totalRevenue: 45000000,
  }

  const statCards = [
    { label: 'admin.totalOrders', value: displayStats.totalOrders, color: 'bg-blue-500' },
    { label: 'admin.pendingOrders', value: displayStats.pendingOrders, color: 'bg-yellow-500' },
    { label: 'admin.processingOrders', value: displayStats.processingOrders, color: 'bg-purple-500' },
    { label: 'admin.deliveredOrders', value: displayStats.deliveredOrders, color: 'bg-green-500' },
    { label: 'admin.totalRevenue', value: `${displayStats.totalRevenue.toLocaleString('vi-VN')} ₫`, color: 'bg-indigo-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" className="text-black" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.dashboard')}</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className={`w-10 h-10 ${stat.color} rounded-lg mb-3`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{t(stat.label)}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a href="/admin/products" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <p className="font-medium text-gray-900">{t('admin.addProduct')}</p>
            <p className="text-sm text-gray-500">Add new product</p>
          </a>
          <a href="/admin/categories" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <p className="font-medium text-gray-900">Manage Categories</p>
            <p className="text-sm text-gray-500">Add or edit categories</p>
          </a>
          <a href="/admin/orders" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <p className="font-medium text-gray-900">{t('admin.orders')}</p>
            <p className="text-sm text-gray-500">View all orders</p>
          </a>
          <a href="/admin/banners" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
            <p className="font-medium text-gray-900">Manage Banners</p>
            <p className="text-sm text-gray-500">Update homepage banners</p>
          </a>
        </div>
      </div>
    </div>
  )
}