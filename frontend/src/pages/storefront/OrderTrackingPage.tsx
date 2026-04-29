import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { orderApi, OrderTrackingInfo } from '../../services/productApi'
import { usePrice } from '@/hooks/usePrice'

export default function OrderTrackingPage() {
  const { t } = useTranslation()
  const fmt = usePrice()
  const [labelId, setLabelId] = useState('')
  const [tracking, setTracking] = useState<OrderTrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!labelId.trim()) return

    setLoading(true)
    
    setError(null)
    setTracking(null)

    try {
      const response = await orderApi.trackOrder(labelId.trim())
      if (response.success) {
        setTracking(response.data)
      } else {
        setError(response.error?.message || 'Không tìm thấy đơn hàng')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Đã xảy ra lỗi khi tra cứu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-black">{t('common.home')}</Link>
        <span className="mx-2">/</span>
        <span className="text-black">Tra cứu đơn hàng</span>
      </nav>

      {/* Page Title */}
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-wide mb-8">
        Tra cứu đơn hàng
      </h1>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="max-w-md mb-12">
        <div className="flex gap-2">
          <input
            type="text"
            value={labelId}
            onChange={(e) => setLabelId(e.target.value)}
            placeholder="Nhập mã vận đơn (VD: S1.A1.17373471)"
            className="flex-1 border border-gray-200 px-4 py-3 focus:border-black focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !labelId.trim()}
            className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {loading ? '...' : 'Tra cứu'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Nhập mã vận đơn GHTK để tra cứu trạng thái giao hàng
        </p>
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg max-w-lg">
          {error}
        </div>
      )}

      {/* Tracking Result */}
      {tracking && (
        <div className="max-w-2xl">
          {/* Status Badge */}
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mã vận đơn</p>
                <p className="text-xl font-bold">{tracking.labelId}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                tracking.status === '5' ? 'bg-green-100 text-green-700' :
                tracking.status === '4' ? 'bg-blue-100 text-blue-700' :
                tracking.status === '9' || tracking.status === '-1' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {tracking.statusVi}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="font-medium mb-4">Thông tin người nhận</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tên</p>
                <p className="font-medium">{tracking.customer.fullname}</p>
              </div>
              <div>
                <p className="text-gray-500">Số điện thoại</p>
                <p className="font-medium">{tracking.customer.tel}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Địa chỉ</p>
                <p className="font-medium">{tracking.customer.address}</p>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-medium mb-4">Thông tin đơn hàng</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ngày tạo</p>
                <p className="font-medium">{tracking.created}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày lấy hàng</p>
                <p className="font-medium">{tracking.pickDate || 'Chưa có'}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày giao dự kiến</p>
                <p className="font-medium">{tracking.deliverDate || 'Chưa có'}</p>
              </div>
              <div>
                <p className="text-gray-500">Cân nặng</p>
                <p className="font-medium">{(tracking.weight / 1000).toFixed(2)} kg</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-gray-500">Phí vận chuyển</p>
                <p className="font-medium text-lg">{fmt(Number(tracking.money.ship))}</p>
              </div>
              {tracking.money.pick > 0 && (
                <div>
                  <p className="text-gray-500">Thu hộ (COD)</p>
                  <p className="font-medium text-lg">{fmt(Number(tracking.money.pick))}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
