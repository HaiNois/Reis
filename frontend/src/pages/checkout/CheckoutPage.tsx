import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'

export default function CheckoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In MVP, just clear cart and redirect to success
    clearCart()
    navigate('/checkout/success')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <p>Giỏ hàng trống</p>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-serif font-bold mb-8">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Info */}
          <div>
            <h2 className="text-xl font-medium mb-4">{t('checkout.shippingInfo')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                name="firstName"
                placeholder={t('checkout.fullName')}
                value={formData.firstName}
                onChange={handleChange}
                className="input col-span-2"
                required
              />
              <input
                name="email"
                type="email"
                placeholder={t('checkout.email')}
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                name="phone"
                type="tel"
                placeholder={t('checkout.phone')}
                value={formData.phone}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                name="address"
                placeholder={t('checkout.address')}
                value={formData.address}
                onChange={handleChange}
                className="input col-span-2"
                required
              />
              <input
                name="city"
                placeholder={t('checkout.city')}
                value={formData.city}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                name="district"
                placeholder={t('checkout.district')}
                value={formData.district}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                name="ward"
                placeholder={t('checkout.ward')}
                value={formData.ward}
                onChange={handleChange}
                className="input"
              />
              <textarea
                name="notes"
                placeholder={t('checkout.notes')}
                value={formData.notes}
                onChange={handleChange}
                className="input col-span-2"
                rows={3}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h2 className="text-xl font-medium mb-4">{t('checkout.paymentMethod')}</h2>
            <label className="flex items-center gap-3 p-4 border border-primary-900 bg-primary-50">
              <input type="radio" name="payment" value="COD" defaultChecked />
              <span>{t('checkout.cod')}</span>
            </label>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-primary-50 p-6 h-fit">
          <h2 className="text-xl font-medium mb-4">{t('checkout.orderSummary')}</h2>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between text-sm">
                <span>{item.productName} x{item.quantity}</span>
                <span>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
              </div>
            ))}
          </div>
          <div className="border-t border-primary-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('cart.subtotal')}</span>
              <span>{getTotal().toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('cart.shipping')}</span>
              <span>Miễn phí</span>
            </div>
            <div className="flex justify-between font-medium text-lg">
              <span>{t('cart.total')}</span>
              <span>{getTotal().toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full mt-6">
            {t('checkout.placeOrder')}
          </button>
        </div>
      </form>
    </div>
  )
}