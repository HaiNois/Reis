import api from './api'

// Types
export interface OrderItem {
  id: string
  variantId: string
  productName: string
  variantName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod: 'COD' | 'BANK_TRANSFER'
  subtotal: number
  shippingFee: number
  total: number
  shippingFirstName: string
  shippingLastName: string
  shippingPhone: string
  shippingAddress: string
  shippingWard: string
  shippingDistrict: string
  shippingProvince: string
  notes?: string
  items: OrderItem[]
  createdAt: string
}

export interface CartItem {
  id: string
  variantId: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    images: { id: string; url: string; position: number }[]
  }
  variant: {
    id: string
    sku: string
    size: string
    color: string
    price: number
    quantity: number
  }
  itemTotal: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  itemCount: number
}

// API calls
export const orderApi = {
  createOrder: async (data: {
    items: { variantId: string; quantity: number }[]
    paymentMethod: 'COD' | 'BANK_TRANSFER'
    shippingFirstName: string
    shippingLastName: string
    shippingPhone: string
    shippingAddress: string
    shippingWard: string
    shippingDistrict: string
    shippingProvince: string
    notes?: string
  }) => {
    const response = await api.post('/orders', data)
    return response.data
  },

  getOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  getOrderByNumber: async (orderNumber: string) => {
    const response = await api.get(`/orders/${orderNumber}`)
    return response.data
  },

  cancelOrder: async (orderId: string) => {
    const response = await api.post(`/orders/${orderId}/cancel`)
    return response.data
  },

  // Admin
  getAllOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/orders', { params })
    return response.data
  },

  getOrderStats: async () => {
    const response = await api.get('/admin/orders/stats')
    return response.data
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/admin/orders/${orderId}/status`, { status })
    return response.data
  },
}

export const cartApi = {
  getCart: async () => {
    const response = await api.get('/cart')
    return response.data
  },

  addItem: async (data: { variantId: string; quantity: number }) => {
    const response = await api.post('/cart/items', data)
    return response.data
  },

  updateItem: async (itemId: string, quantity: number) => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity })
    return response.data
  },

  removeItem: async (itemId: string) => {
    const response = await api.delete(`/cart/items/${itemId}`)
    return response.data
  },

  clearCart: async () => {
    const response = await api.delete('/cart')
    return response.data
  },

  mergeCart: async (sessionId: string) => {
    const response = await api.post('/cart/merge', {}, { headers: { 'x-session-id': sessionId } })
    return response.data
  },
}