import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function OrderHistoryPage() {
  const { t } = useTranslation()

  // Demo orders
  const orders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      date: '2024-01-15',
      total: 2400000,
      status: 'DELIVERED',
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      date: '2024-01-20',
      total: 1200000,
      status: 'PROCESSING',
    },
  ]

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-serif font-bold mb-8">{t('account.myOrders')}</h1>

      {orders.length === 0 ? (
        <p className="text-primary-600">{t('account.noOrders')}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/account/orders/${order.orderNumber}`}
              className="block bg-primary-50 p-6 hover:bg-primary-100 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-primary-500">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{order.total.toLocaleString('vi-VN')} ₫</p>
                  <p className="text-sm text-green-600">{t(`order.status.${order.status.toLowerCase()}`)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}