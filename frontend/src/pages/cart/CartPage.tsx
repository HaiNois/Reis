import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'

export default function CartPage() {
  const { t } = useTranslation()
  const { items, updateQuantity, removeItem, getTotal } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">{t('cart.empty')}</h2>
        <p className="text-primary-600 mb-8">{t('cart.emptyDesc')}</p>
        <Link to="/products" className="btn btn-primary">
          {t('cart.continueShopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-serif font-bold mb-8">{t('cart.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-6 py-6 border-b border-primary-200">
              <div className="w-24 h-32 bg-primary-200 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium mb-1">{item.productName}</h3>
                <p className="text-sm text-primary-500 mb-2">{item.variantName}</p>
                <p className="text-primary-900">{item.price.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div className="flex flex-col items-end gap-4">
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-sm text-primary-500 hover:text-red-600"
                >
                  {t('cart.remove')}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="w-8 h-8 border border-primary-300"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="w-8 h-8 border border-primary-300"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-primary-50 p-6 h-fit">
          <h3 className="font-medium mb-4">{t('cart.summary')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t('cart.subtotal')}</span>
              <span>{getTotal().toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between">
              <span>{t('cart.shipping')}</span>
              <span>{t('common.free')}</span>
            </div>
            <div className="border-t border-primary-200 pt-2 flex justify-between font-medium">
              <span>{t('cart.total')}</span>
              <span>{getTotal().toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
          <Link to="/checkout" className="btn btn-primary w-full mt-6">
            {t('cart.checkout')}
          </Link>
        </div>
      </div>
    </div>
  )
}