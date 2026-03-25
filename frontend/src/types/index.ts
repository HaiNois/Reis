export interface Product {
  id: string
  name: string
  slug: string
  description: string
  material?: string
  careGuide?: string
  categoryId: string
  category?: Category
  isActive: boolean
  isFeatured: boolean
  images: ProductImage[]
  variants: ProductVariant[]
  createdAt: string
  updatedAt: string
}

export interface ProductImage {
  id: string
  url: string
  altText?: string
  sortOrder: number
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  size?: Size
  color?: Color
  price: number
  compareAtPrice?: number
  isActive: boolean
  inventory?: Inventory
}

export interface Size {
  id: string
  name: string
  code: string
}

export interface Color {
  id: string
  name: string
  code: string
  hex: string
}

export interface Inventory {
  id: string
  variantId: string
  quantity: number
  reservedQuantity: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
  children?: Category[]
  sortOrder: number
}

export interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  sortOrder: number
  products?: Product[]
}

export interface Banner {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  linkUrl?: string
  linkType?: 'PRODUCT' | 'COLLECTION' | 'URL'
  isActive: boolean
  sortOrder: number
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'CUSTOMER' | 'ADMIN'
}

export interface Address {
  id: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  ward: string
  district: string
  province: string
  isDefault: boolean
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discountAmount: number
  shippingFee: number
  total: number
  shippingAddress: Address
  paymentMethod: 'COD' | 'STRIPE' | 'PAYPAL'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productName: string
  variantInfo: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface PromoCode {
  id: string
  code: string
  description?: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minOrderAmount: number
  maxUses: number
  usedCount: number
  isActive: boolean
  startsAt: string
  expiresAt: string
}

export interface PageParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}