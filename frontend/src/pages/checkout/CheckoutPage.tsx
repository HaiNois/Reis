import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User as UserIcon } from 'lucide-react'
import { useCartStore } from '@/stores/cartStore'
import { useAuthStore } from '@/stores/authStore'
import { usePrice } from '@/hooks/usePrice'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/services/api'

declare global {
  interface Window {
    paypal?: any
  }
}

type PaymentMethod = 'PAYPAL' | 'COD'

export default function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { items, getTotal, getTotalUsd, clearCart } = useCartStore()
  const fmt = usePrice()
  const { user, logout } = useAuthStore()
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAYPAL')

  const paypalContainerRef = useRef<HTMLDivElement | null>(null)
  const paypalRenderedRef = useRef(false)

  // Prefill from authenticated user. ProtectedRoute guarantees user is non-null here,
  // but we still fall back defensively if state is briefly stale.
  const [formData, setFormData] = useState({
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    address: '',
    city: '',
    country: 'VN',
    phone: user?.phone ?? '',
    notes: '',
  })

  const handleLogoutAndSwitch = async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // ignore
    }
    logout()
    navigate('/login?redirect=/checkout', { replace: true })
  }

  // Keep latest state reachable from PayPal SDK callbacks (stale closures otherwise).
  const itemsRef = useRef(items)
  const notesRef = useRef(formData.notes)
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  useEffect(() => {
    notesRef.current = formData.notes
  }, [formData.notes])

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

  const isInternational = formData.country !== 'VN'
  const lang = i18n.language

  // COD is only available for Vietnam; force PayPal for international.
  useEffect(() => {
    if (isInternational && paymentMethod === 'COD') {
      setPaymentMethod('PAYPAL')
    }
  }, [isInternational, paymentMethod])

  // Load PayPal SDK and render Smart Buttons. Render only when PayPal is selected.
  useEffect(() => {
    if (paymentMethod !== 'PAYPAL') return
    if (!paypalClientId) {
      console.warn('PayPal Client ID not configured (VITE_PAYPAL_CLIENT_ID)')
      return
    }

    let script: HTMLScriptElement | null = null

    const renderButtons = () => {
      if (paypalRenderedRef.current) return
      if (!window.paypal || !paypalContainerRef.current) return
      paypalRenderedRef.current = true

      window.paypal
        .Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },

          onClick: (_data: unknown, actions: any) => {
            if (itemsRef.current.length === 0) {
              alert(t('cart.empty'))
              return actions.reject()
            }
            return actions.resolve()
          },

          createOrder: async () => {
            setLoading(true)
            try {
              const paypalResponse = await api.post('/payment/paypal/create-order', {
                currency: 'USD',
                items: itemsRef.current.map((item) => ({
                  variantId: item.variantId,
                  quantity: item.quantity,
                })),
              })
              return paypalResponse.data.data.orderId as string
            } catch (error: any) {
              console.error('PayPal createOrder error:', error)
              const backendMessage = error?.response?.data?.error?.message
              alert(
                backendMessage
                  ? `${t('checkout.paypalInitFailed')}: ${backendMessage}`
                  : t('checkout.paypalInitFailed')
              )
              setLoading(false)
              throw error
            }
          },

          onApprove: async (data: { orderID: string }) => {
            try {
              const captureResponse = await api.post('/payment/paypal/capture-order', {
                orderId: data.orderID,
                items: itemsRef.current.map((item) => ({
                  variantId: item.variantId,
                  quantity: item.quantity,
                })),
                notes: notesRef.current || undefined,
              })

              if (captureResponse.data.success) {
                const orderNumber = captureResponse.data.data.orderNumber
                clearCart()
                sessionStorage.setItem('codOrderNumber', orderNumber || '')
                navigate('/checkout/success')
              } else {
                alert(t('checkout.paypalCaptureFailed'))
                setLoading(false)
              }
            } catch (error: any) {
              console.error('PayPal onApprove error:', error)
              const backendMessage = error?.response?.data?.error?.message
              alert(
                backendMessage
                  ? `${t('checkout.paypalCaptureFailed')}: ${backendMessage}`
                  : t('checkout.paypalCaptureFailed')
              )
              setLoading(false)
            }
          },

          onCancel: () => {
            setLoading(false)
            alert(t('checkout.paypalCancelled'))
          },

          onError: (err: unknown) => {
            console.error('PayPal onError:', err)
            setLoading(false)
            alert(t('checkout.paypalInitFailed'))
          },
        })
        .render(paypalContainerRef.current)
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]')
    if (existing && window.paypal) {
      renderButtons()
    } else if (existing) {
      existing.addEventListener('load', renderButtons)
    } else {
      script = document.createElement('script')
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`
      script.async = true
      script.dataset.paypalSdk = 'true'
      script.onload = renderButtons
      script.onerror = () => console.warn('Failed to load PayPal SDK')
      document.body.appendChild(script)
    }

    return () => {
      paypalRenderedRef.current = false
      if (paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = ''
      }
    }
  }, [paymentMethod, paypalClientId, t, clearCart, navigate])

  const createCodOrder = async () => {
    if (!formData.firstName || !formData.lastName || !formData.address || !formData.phone || !formData.city) {
      alert(t('checkout.fillAllFields'))
      return
    }

    setLoading(true)
    try {
      const orderData = {
        shippingFirstName: formData.firstName,
        shippingLastName: formData.lastName,
        shippingPhone: formData.phone,
        shippingAddress: formData.address,
        shippingCity: formData.city,
        shippingCountry: formData.country,
        paymentMethod: 'COD',
        notes: formData.notes,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      }

      const response = await api.post('/orders', orderData)
      const orderNumber = response.data.data.orderNumber

      clearCart()
      sessionStorage.setItem('codOrderNumber', orderNumber)
      navigate('/checkout/success')
    } catch (error: any) {
      console.error('Order creation error:', error)
      const backendMessage = error?.response?.data?.error?.message
      alert(
        backendMessage
          ? `${t('checkout.orderFailed')}: ${backendMessage}`
          : t('checkout.orderFailed')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
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
  const subtotalUsd: number | null = getTotalUsd()
  const totalUsd: number | null = subtotalUsd

  return (
    <div className="min-h-screen">
      <div className="bg-white max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif font-bold mb-4">{t('checkout.title')}</h1>

        {/* "Ordering as" strip — confirms the authenticated account */}
        {user && (
          <div className="mb-6 flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <UserIcon className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-gray-500 hidden sm:inline">{t('auth.orderingAs')}:</span>
              <span className="font-medium text-gray-900 truncate">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={handleLogoutAndSwitch}
              className="text-xs text-gray-600 hover:text-black underline underline-offset-2 flex-shrink-0"
            >
              {t('auth.switchAccount')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Payment Method — moved to top */}
            <div className="bg-card rounded-xl p-5">
              <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">1</span>
                {t('checkout.paymentMethod')}
              </h2>

              <div className="space-y-3">
                {/* PayPal option */}
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'PAYPAL' ? 'border-black bg-black/5' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="PAYPAL"
                    checked={paymentMethod === 'PAYPAL'}
                    onChange={() => setPaymentMethod('PAYPAL')}
                    className="accent-black"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">PayPal</span>
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                        {lang === 'vi' ? 'Không cần điền form' : 'No form needed'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'vi'
                        ? 'Thanh toán nhanh — địa chỉ lấy từ PayPal'
                        : 'Fast checkout — shipping address from PayPal'}
                    </p>
                  </div>
                </label>

                {/* COD option — only for Vietnam */}
                {!isInternational && (
                  <label
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'COD' ? 'border-black bg-black/5' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={() => setPaymentMethod('COD')}
                      className="accent-black"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{t('checkout.cod')}</span>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'vi' ? 'Thanh toán khi nhận hàng' : 'Pay on delivery'}
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {isInternational && (
                <p className="text-sm text-muted-foreground mt-3">
                  {t('checkout.internationalNotice')}
                </p>
              )}
            </div>

            {/* 2. PayPal Buttons — shown when PayPal selected */}
            {paymentMethod === 'PAYPAL' && (
              <div className="bg-card rounded-xl p-5">
                <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">2</span>
                  {lang === 'vi' ? 'Thanh toán với PayPal' : 'Pay with PayPal'}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {lang === 'vi'
                    ? 'Nhấn nút PayPal bên dưới để mở cửa sổ thanh toán. Thông tin giao hàng sẽ lấy từ tài khoản PayPal của bạn.'
                    : 'Click the PayPal button below to open the checkout popup. Your shipping address will come from your PayPal account.'}
                </p>
                <div
                  ref={paypalContainerRef}
                  className={loading ? 'opacity-60 pointer-events-none' : ''}
                />

                {/* Optional order notes */}
                <div className="mt-4">
                  <label className="text-sm text-muted-foreground block mb-1">
                    {t('checkout.notes')}
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            {/* 2. Shipping Form — only when COD selected */}
            {paymentMethod === 'COD' && (
              <>
                <div className="bg-card rounded-xl p-5">
                  <h2 className="text-base font-medium mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center">2</span>
                    {t('checkout.shippingInfo')}
                  </h2>
                  <div className="space-y-4">
                    <Input
                      name="email"
                      type="email"
                      placeholder={t('auth.email')}
                      value={formData.email}
                      onChange={handleChange}
                      className="h-12"
                    />
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
                    <div>
                      <label className="text-sm text-muted-foreground block mb-1">
                        {t('checkout.notes')}
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={2}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
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

                {/* Place Order button for COD */}
                <button
                  type="button"
                  onClick={createCodOrder}
                  disabled={loading}
                  className="w-full h-14 bg-black hover:bg-black/90 text-white font-medium rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span>{t('common.processing')}</span>
                  ) : (
                    <span>{t('checkout.placeOrder')}</span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-card rounded-xl p-5 lg:sticky lg:top-4">
              <h2 className="text-base font-medium mb-4">{t('checkout.orderSummary')}</h2>

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
                      <p className="text-sm font-medium mt-1">{fmt(item.price, item.priceUsd)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                  <span>{fmt(subtotal, subtotalUsd)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('cart.shipping')}</span>
                  <span className="text-green-600 font-medium">{t('common.free')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>{t('cart.total')}</span>
                  <span>{fmt(total, totalUsd)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
