import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function OrderDetailPage() {
  const { orderNumber } = useParams()
  const { t } = useTranslation()

  // Demo order
  const order = {
    orderNumber,
    status: 'PROCESSING',
    createdAt: '2024-01-20',
    items: [
      { id: '1', productName: 'Áo sơ mi cotton', variantInfo: 'M - Trắng', quantity: 2, unitPrice: 600000, totalPrice: 1200000 },
    ],
    subtotal: 1200000,
    shippingFee: 0,
    total: 1200000,
    shippingAddress: {
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      addressLine1: '123 Đường ABC',
      ward: 'Phường 1',
      district: 'Quận 1',
      province: 'TP.HCM',
    },
  }

  return (
    <div className="container-custom py-8">
      <Link to="/account/orders" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
        ← Quay lại đơn hàng
      </Link>

      <h1 className="text-3xl font-serif font-bold mb-8">Đơn hàng {order.orderNumber}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-primary-50 p-6">
            <h2 className="font-medium mb-4">Sản phẩm</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-4 border-b border-primary-200">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-primary-500">{item.variantInfo}</p>
                  <p className="text-sm">x{item.quantity}</p>
                </div>
                <p>{item.totalPrice.toLocaleString('vi-VN')} ₫</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-primary-50 p-6 mb-4">
            <h2 className="font-medium mb-4">Tóm tắt</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Trạng thái</span>
                <span className="text-green-600">{t(`order.status.${order.status.toLowerCase()}`)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày đặt</span>
                <span>{order.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 p-6">
            <h2 className="font-medium mb-4">Địa chỉ giao hàng</h2>
            <p className="text-sm">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
              {order.shippingAddress.addressLine1}<br />
              {order.shippingAddress.ward}, {order.shippingAddress.district}<br />
              {order.shippingAddress.province}
            </p>
          </div>

          <div className="bg-primary-50 p-6 mt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{order.subtotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{order.shippingFee === 0 ? 'Miễn phí' : order.shippingFee.toLocaleString('vi-VN') + ' ₫'}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-primary-200">
                <span>Tổng cộng</span>
                <span>{order.total.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}