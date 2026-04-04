import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cartStore'
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

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotal, clearCart } = useCartStore()
  const [paymentMethod] = useState<'COD' | 'PAYPAL'>('COD')
  const [paypalReady, setPaypalReady] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: 'Hồ Chí Minh',
    district: '',
    ward: '',
    phone: '',
    notes: '',
  })

  // Vietnamese provinces/cities for dropdown
  const cities = [
    { value: 'hcm', label: 'Hồ Chí Minh' },
    { value: 'hanoi', label: 'Hà Nội' },
    { value: 'danang', label: 'Đà Nẵng' },
    { value: 'other', label: 'Tỉnh/Thành phố khác' },
  ]

  const districts: Record<string, { value: string; label: string }[]> = {
    hcm: [
      { value: 'quan1', label: 'Quận 1' },
      { value: 'quan2', label: 'Quận 2' },
      { value: 'quan3', label: 'Quận 3' },
      { value: 'quan4', label: 'Quận 4' },
      { value: 'quan5', label: 'Quận 5' },
      { value: 'quan6', label: 'Quận 6' },
      { value: 'quan7', label: 'Quận 7' },
      { value: 'quan8', label: 'Quận 8' },
      { value: 'quan9', label: 'Quận 9' },
      { value: 'quan10', label: 'Quận 10' },
      { value: 'quan11', label: 'Quận 11' },
      { value: 'quan12', label: 'Quận 12' },
      { value: 'binhthanh', label: 'Bình Thạnh' },
      { value: 'tanbinh', label: 'Tân Bình' },
      { value: 'tanphu', label: 'Tân Phú' },
      { value: 'phunhuan', label: 'Phú Nhuận' },
      { value: 'go vap', label: 'Gò Vấp' },
      { value: 'thu duc', label: 'Thủ Đức' },
    ],
    hanoi: [
      { value: 'quan1', label: 'Quận 1' },
      { value: 'quan2', label: 'Quận 2' },
      { value: 'quan3', label: 'Quận 3' },
      { value: 'hoan kiem', label: 'Hoàn Kiếm' },
      { value: 'tay ho', label: 'Tây Hồ' },
      { value: 'cau giay', label: 'Cầu Giấy' },
      { value: 'thanh xuan', label: 'Thanh Xuân' },
    ],
    danang: [
      { value: 'hai chau', label: 'Hải Châu' },
      { value: 'thanh khe', label: 'Thanh Khê' },
      { value: 'son tra', label: 'Sơn Trà' },
      { value: 'ngu hanh son', label: 'Ngũ Hành Sơn' },
      { value: 'lien chieu', label: 'Liên Chiểu' },
    ],
    other: [
      { value: 'other', label: 'Quận/Huyện' },
    ],
  }

  // Load PayPal SDK
  useEffect(() => {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID
    if (!clientId) {
      console.warn('PayPal Client ID not configured')
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`
    script.async = true
    script.onload = () => setPaypalReady(true)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const createOrder = async (
    paymentMethodVal: string,
    paymentStatus: string,
    paypalCaptureId?: string
  ) => {
    setLoading(true)
    try {
      const orderData = {
        shippingFirstName: formData.firstName,
        shippingLastName: formData.lastName,
        shippingPhone: formData.phone,
        shippingAddress: `${formData.address}, ${formData.ward ? formData.ward + ', ' : ''}${formData.district}, ${formData.city}`,
        paymentMethod: paymentMethodVal,
        paymentStatus,
        paypalCaptureId,
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
          price: item.price,
          quantity: item.quantity,
        })),
      }

      await api.post('/orders', orderData)
      clearCart()
      navigate('/checkout/success')
    } catch (error) {
      console.error('Order creation error:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentMethod === 'PAYPAL') return
    await createOrder('COD', 'PENDING')
  }

  const handlePayPalClick = async () => {
    if (!paypalReady || !window.paypal) {
      alert('PayPal chưa sẵn sàng. Vui lòng thử lại sau.')
      return
    }

    try {
      setLoading(true)
      const totalVND = getTotal()
      const exchangeRate = 25000
      const totalUSD = (totalVND / exchangeRate).toFixed(2)

      const response = await api.post('/payment/paypal/create-order', {
        amount: parseFloat(totalUSD),
        currency: 'USD',
      })

      if (response.data.success) {
        const approvalUrl = response.data.data.approvalUrl
        // Redirect to PayPal
        window.location.href = approvalUrl
      } else {
        throw new Error('Failed to create PayPal order')
      }
    } catch (error) {
      console.error('PayPal error:', error)
      alert('Đã xảy ra lỗi khi khởi tạo PayPal. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const currentDistricts = districts[formData.city] || districts.other

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 text-center">
        <p className="text-muted-foreground">Giỏ hàng trống</p>
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
        <h1 className="text-2xl font-serif font-bold mb-4">Checkout</h1>

        <div className="rounded-2xl p-3 lg:p-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-7 lg:border-r-2 lg:border-black lg:border-solid lg:pr-8 space-y-6">
            {/* Contact */}
            {/* Payment Buttons at top */}
            <div className="space-y-3">
              {/* PayPal Button */}
              <button
                type="button"
                onClick={handlePayPalClick}
                disabled={loading}
                className="w-full h-14 bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-6" />
                    <span>PayPal Checkout</span>
                  </>
                )}
              </button>

              {/* COD Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-black hover:bg-black/90 text-white font-medium rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <span>Pay on Delivery (COD)</span>
                )}
              </button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground uppercase">Or</span>
              <div className="flex-1 h-px bg-muted-foreground/30" />
            </div>

            {/* Contact */}
            <div className="bg-card rounded-xl p-3">
            <h2 className="text-base font-medium mb-4">Contact</h2>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="h-12"
              required
            />
          </div>

          {/* Shipping Address */}
          <div className="bg-card rounded-xl p-3">
            <h2 className="text-base font-medium mb-4">Shipping Address</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-12"
                  required
                />
                <Input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-12"
                  required
                />
              </div>
              <Input
                name="address"
                placeholder="Address (e.g. 123 Main St)"
                value={formData.address}
                onChange={handleChange}
                className="h-12"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Select value={formData.city} onValueChange={(v) => setFormData({ ...formData, city: v, district: '' })}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={formData.district} onValueChange={(v) => setFormData({ ...formData, district: v })}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="District" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentDistricts.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                name="phone"
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                className="h-12"
                required
              />
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-card rounded-xl p-3">
            <h2 className="text-base font-medium mb-4">Shipping Method</h2>
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Standard Delivery</p>
                <p className="text-sm text-muted-foreground">Delivery in 3-5 days</p>
              </div>
              <p className="font-medium">Free</p>
            </div>
          </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-card rounded-xl p-3 sticky top-4">
              <h2 className="text-base font-medium mb-4">Your Order</h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4">
                    <div className="w-20 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && item.image !== '/images/products/placeholder.jpg' ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                      <p className="text-sm font-medium mt-1">{item.quantity} x {item.price.toLocaleString('vi-VN')} ₫</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? 'Free' : shipping.toLocaleString('vi-VN') + ' ₫'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{tax.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between font-medium text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{total.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
    </div>
  )
}
