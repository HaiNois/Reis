import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function SuccessPage() {
  const { t } = useTranslation()

  return (
    <div className="container-custom py-16 text-center">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-serif font-bold mb-4">Đặt hàng thành công!</h1>
      <p className="text-primary-600 mb-8">
        Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/products" className="btn btn-primary">
          Tiếp tục mua sắm
        </Link>
        <Link to="/account/orders" className="btn btn-outline">
          Xem đơn hàng
        </Link>
      </div>
    </div>
  )
}