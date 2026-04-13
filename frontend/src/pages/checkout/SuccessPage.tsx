import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'
import api from '@/services/api'

export default function SuccessPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCartStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  useEffect(() => {
    const capturePayPalPayment = async () => {
      const token = searchParams.get('token')
      const orderId = searchParams.get('orderId')
      const orderNumFromUrl = searchParams.get('orderNumber')

      // Check sessionStorage as fallback
      const sessionOrderId = sessionStorage.getItem('paypalOrderId')
      const sessionOrderNumber = sessionStorage.getItem('paypalOrderNumber')
      const sessionPaypalOrderId = sessionStorage.getItem('paypalCheckoutOrderId')

      const localOrderId = orderId || sessionOrderId
      const paypalOrderId = token || sessionPaypalOrderId
      const orderNum = orderNumFromUrl || sessionOrderNumber

      // If no PayPal token, this is likely a COD order - just show success
      if (!paypalOrderId) {
        if (sessionOrderNumber) {
          setOrderNumber(sessionOrderNumber)
          clearCart()
          sessionStorage.removeItem('paypalOrderId')
          sessionStorage.removeItem('paypalOrderNumber')
          sessionStorage.removeItem('paypalCheckoutOrderId')
        }
        setStatus('success')
        return
      }

      try {
        // Capture PayPal payment
        const response = await api.post('/payment/paypal/capture-order', {
          orderId: paypalOrderId,
          localOrderId: localOrderId,
        })

        if (response.data.success) {
          setOrderNumber(orderNum || null)
          clearCart()
          // Clear session storage
          sessionStorage.removeItem('paypalOrderId')
          sessionStorage.removeItem('paypalOrderNumber')
          sessionStorage.removeItem('paypalCheckoutOrderId')
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('PayPal capture error:', error)
        setStatus('error')
      }
    }

    capturePayPalPayment()
  }, [searchParams, clearCart])

  if (status === 'loading') {
    return (
      <div className="container-custom py-16 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-serif font-bold mb-4">{t('success.processingTitle')}</h1>
        <p className="text-muted-foreground">{t('success.processingMessage')}</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container-custom py-16 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-bold mb-4">{t('success.paymentFailedTitle')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('success.paymentFailedMessage')}
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/cart" className="btn btn-primary">
            {t('common.backToCart')}
          </Link>
          <Link to="/" className="btn btn-outline">
            {t('common.backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-16 text-center">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-serif font-bold mb-4">{t('success.title')}</h1>
      <p className="text-primary-600 mb-4">
        {t('success.message')}
      </p>
      {orderNumber && (
        <p className="text-lg font-medium mb-8">{t('success.orderNumber')}: <span className="text-primary">{orderNumber}</span></p>
      )}
      <div className="flex justify-center gap-4">
        <Link to="/products" className="btn btn-primary">
          {t('success.continueShopping')}
        </Link>
        <Link to="/account/orders" className="btn btn-outline">
          {t('success.viewOrder')}
        </Link>
      </div>
    </div>
  )
}