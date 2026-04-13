import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '@/stores/cartStore'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PayPalButton } from '@/components/ui/paypal-button'
import api from '@/services/api'

declare global {
  interface Window {
    paypal?: any
  }
}

export default function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID
  const [paypalReady, setPaypalReady] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    country: 'VN',
    phone: '',
    notes: '',
  })

  // Countries list
  const countries = [
    { value: 'VN', label: 'Vietnam' },
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'CA', label: 'Canada' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'KR', label: 'South Korea' },
    { value: 'SG', label: 'Singapore' },
    { value: 'MY', label: 'Malaysia' },
    { value: 'TH', label: 'Thailand' },
    { value: 'OTHER', label: 'Other Country' },
  ]

  // Check if international (not Vietnam)
  const isInternational = formData.country !== 'VN'
  const lang = i18n.language

  // Note: PayPal SDK is loaded but we use redirect flow via backend API
  // SDK loading is kept for potential future SDK button integration
  useEffect(() => {
    if (!paypalClientId) {
      console.warn('PayPal Client ID not configured (VITE_PAYPAL_CLIENT_ID)')
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`
    script.async = true
    script.onload = () => setPaypalReady(true)
    script.onerror = () => console.warn('Failed to load PayPal SDK')
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [paypalClientId])

  const createOrder = async (paymentMethodVal: 'COD' | 'PAYPAL') => {
    setLoading(true)
    try {
      const orderData = {
        shippingFirstName: formData.firstName,
        shippingLastName: formData.lastName,
        shippingPhone: formData.phone,
        shippingAddress: formData.address,
        shippingCity: formData.city,
        shippingCountry: formData.country,
        paymentMethod: paymentMethodVal,
        notes: formData.notes,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      }

      const response = await api.post('/orders', orderData)
      const orderNumber = response.data.data.orderNumber

      // For COD, redirect to success directly
      if (paymentMethodVal === 'COD') {
        clearCart()
        sessionStorage.setItem('codOrderNumber', orderNumber)
        navigate('/checkout/success')
      }
      // For PayPal: DON'T clear cart here - wait until payment confirmed on success page
    } catch (error) {
      console.error('Order creation error:', error)
      alert(t('checkout.orderFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields for COD
    if (!formData.firstName || !formData.lastName || !formData.address || !formData.phone) {
      alert(t('checkout.fillAllFields'))
      return
    }

    await createOrder('COD')
  }

  const handlePayPalClick = async () => {
    if (!paypalReady || !window.paypal) {
      alert(t('checkout.paypalNotReady'))
      return
    }

    // Validate form before PayPal
    if (!formData.firstName || !formData.lastName || !formData.address || !formData.phone || !formData.city) {
      alert(t('checkout.fillAllFields'))
      return
    }

    try {
      setLoading(true)

      // Create order first (PENDING payment)
      const orderData = {
        shippingFirstName: formData.firstName,
        shippingLastName: formData.lastName,
        shippingPhone: formData.phone,
        shippingAddress: formData.address,
        shippingCity: formData.city,
        shippingCountry: formData.country,
        paymentMethod: 'PAYPAL',
        paymentStatus: 'PENDING',
        subtotal: getTotal(),
        shippingFee: 0,
        discount: 0,
        total: getTotal(),
        notes: formData.notes,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          price: Number(item.price),
          quantity: item.quantity,
        })),
      }

      const orderResponse = await api.post('/orders', orderData)
      const localOrderId = orderResponse.data.data.id
      const orderNumber = orderResponse.data.data.orderNumber

      // Store orderId for success page - DON'T clear cart yet!
      sessionStorage.setItem('paypalOrderId', localOrderId)
      sessionStorage.setItem('paypalOrderNumber', orderNumber)

      // Create PayPal order
      const totalVND = getTotal()
      const exchangeRate = 25000
      const totalUSD = (totalVND / exchangeRate).toFixed(2)

      const paypalResponse = await api.post('/payment/paypal/create-order', {
        amount: parseFloat(totalUSD),
        currency: 'USD',
        localOrderId: localOrderId,
      })

      if (paypalResponse.data.success) {
        const paypalOrderId = paypalResponse.data.data.orderId
        const approvalUrl = paypalResponse.data.data.approvalUrl

        // Store PayPal order ID
        sessionStorage.setItem('paypalCheckoutOrderId', paypalOrderId)

        // Append order info to return_url
        const returnUrl = new URL(`${window.location.origin}/checkout/success`)
        returnUrl.searchParams.set('token', paypalOrderId)
        returnUrl.searchParams.set('orderId', localOrderId)
        returnUrl.searchParams.set('orderNumber', orderNumber)

        // Redirect to PayPal with proper return URL
        const finalApprovalUrl = approvalUrl + (approvalUrl.includes('?') ? '&' : '?') + `return_url=${encodeURIComponent(returnUrl.toString())}`

        window.location.href = finalApprovalUrl
      } else {
        throw new Error('Failed to create PayPal order')
      }
    } catch (error) {
      console.error('PayPal error:', error)
      alert(t('checkout.paypalInitFailed'))
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCountryChange = (value: string) => {
    setFormData({ ...formData, country: value, city: '' })
  }

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <p className="text-muted-foreground">{t('cart.empty')}</p>
      </div>
    )
  }

  const subtotal: number = getTotal()
  const shipping: number = 0
  const tax: number = 0
  const total: number = subtotal + shipping + tax

  return (
    <div className="min-h-screen">
      <div className="bg-white max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif font-bold mb-6">{t('checkout.title')}</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-7 space-y-4">
            {/* Contact */}
            <div className="bg-card rounded-xl p-5">
              <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">1</span>
                {t('checkout.paymentMethod')}
              </h2>
              <Input
                name="email"
                type="email"
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={handleChange}
                className="h-12"
              />
            </div>

            {/* Shipping Address */}
            <div className="bg-card rounded-xl p-5">
              <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">2</span>
                {t('checkout.shippingInfo')}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    name="firstName"
                    placeholder={t('checkout.firstName')}
                    value={formData.firstName}
                    onChange={handleChange}
                    className="h-12"
                  />
                  <Input
                    name="lastName"
                    placeholder={t('checkout.lastName')}
                    value={formData.lastName}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
                <Input
                  name="address"
                  placeholder={t('checkout.addressPlaceholder')}
                  value={formData.address}
                  onChange={handleChange}
                  className="h-12"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={t('checkout.country')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    name="city"
                    placeholder={isInternational ? (lang === 'vi' ? 'Thành phố/Tỉnh' : 'City/State/Province') : t('checkout.city')}
                    value={formData.city}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
                <Input
                  name="phone"
                  type="tel"
                  placeholder={t('checkout.phone')}
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-12"
                />
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-card rounded-xl p-5">
              <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">3</span>
                {t('checkout.shippingMethod')}
              </h2>
              <div className="border-2 border-black rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{t('checkout.standardDelivery')}</p>
                    <p className="text-sm text-muted-foreground">{t('checkout.deliveryTime')}</p>
                  </div>
                </div>
                <p className="font-medium">{t('common.free')}</p>
              </div>
            </div>

            {/* Payment - Bottom */}
            <div className="bg-card rounded-xl p-5">
              <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">4</span>
                {t('checkout.payment')}
              </h2>
              <div className="space-y-3">
                <PayPalButton
                  onClick={handlePayPalClick}
                  loading={loading}
                  disabled={loading}
                />

                {/* COD only available for Vietnam */}
                {!isInternational && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-black hover:bg-black/90 text-white font-medium rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <span>{t('common.processing')}</span>
                    ) : (
                      <span>{t('checkout.cod')}</span>
                    )}
                  </button>
                )}

                {/* International notice */}
                {isInternational && (
                  <p className="text-sm text-muted-foreground text-center">
                    {t('checkout.internationalNotice')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-card rounded-xl p-5 lg:sticky lg:top-4">
              <h2 className="text-base font-medium mb-4">{t('checkout.orderSummary')}</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3">
                    <div className="w-16 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative">
                      {item.image && item.image !== '/images/products/placeholder.jpg' ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                      <p className="text-sm font-medium mt-1">{item.price.toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.shipping')}</span>
                  <span className="text-green-600 font-medium">{t('common.free')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>{t('cart.total')}</span>
                  <span>{total.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
