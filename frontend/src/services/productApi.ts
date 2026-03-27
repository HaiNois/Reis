import api from './api'

// ==================== TYPES ====================

export interface Product {
  id: string
  name: string
  nameEn?: string
  slug: string
  shortDescription?: string
  shortDescriptionEn?: string
  description?: string
  descriptionEn?: string
  material?: string
  materialEn?: string
  careGuide?: string
  careGuideEn?: string
  price: number
  compareAtPrice?: number
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  isFeatured: boolean
  isNewArrival: boolean
  categoryId?: string
  category?: Category
  images: ProductImage[]
  variants: ProductVariant[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface ProductImage {
  id: string
  url: string
  position: number
}

export interface ProductVariant {
  id: string
  sku: string
  size: string
  color: string
  price: number
  salePrice?: number
  quantity: number
  isActive: boolean
}

export interface Category {
  id: string
  name: string
  nameEn?: string
  slug: string
  description?: string
  descriptionEn?: string
  image?: string
  parentId?: string
  children?: Category[]
  products?: Product[]
}

export interface Banner {
  id: string
  title: string
  titleEn?: string
  subtitle?: string
  subtitleEn?: string
  image: string
  link?: string
  position: number
  isActive: boolean
}

// ==================== PRODUCT API ====================

export const productApi = {
  // Public
  getProducts: async (params?: {
    category?: string
    search?: string
    sort?: string
    status?: string
    isFeatured?: boolean
    isNewArrival?: boolean
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  getProductBySlug: async (slug: string) => {
    const response = await api.get(`/products/${slug}`)
    return response.data
  },

  getRelatedProducts: async (productId: string, limit: number = 4) => {
    const response = await api.get(`/products/${productId}/related`, { params: { limit } })
    return response.data
  },

  // Admin - Products
  getAdminProducts: async (params?: {
    category?: string
    search?: string
    sort?: string
    status?: string
    isFeatured?: boolean
    isNewArrival?: boolean
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/admin/products', { params })
    return response.data
  },

  getProductById: async (id: string) => {
    const response = await api.get(`/admin/products/${id}`)
    return response.data
  },

  createProduct: async (data: Partial<Product>) => {
    const response = await api.post('/admin/products', data)
    return response.data
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    const response = await api.patch(`/admin/products/${id}`, data)
    return response.data
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/admin/products/${id}`)
    return response.data
  },

  restoreProduct: async (id: string) => {
    const response = await api.post(`/admin/products/${id}/restore`)
    return response.data
  },

  // Admin - Variants
  createVariant: async (productId: string, data: Partial<ProductVariant>) => {
    const response = await api.post(`/admin/products/${productId}/variants`, data)
    return response.data
  },

  updateVariant: async (variantId: string, data: Partial<ProductVariant>) => {
    const response = await api.patch(`/admin/variants/${variantId}`, data)
    return response.data
  },

  updateVariantStock: async (variantId: string, data: { quantity: number; note?: string }) => {
    const response = await api.patch(`/admin/variants/${variantId}/stock`, data)
    return response.data
  },

  deleteVariant: async (variantId: string) => {
    const response = await api.delete(`/admin/variants/${variantId}`)
    return response.data
  },

  // Admin - Images
  addImage: async (productId: string, data: { url: string; position?: number }) => {
    const response = await api.post(`/admin/products/${productId}/images`, data)
    return response.data
  },

  deleteImage: async (imageId: string) => {
    const response = await api.delete(`/admin/images/${imageId}`)
    return response.data
  },
}

// ==================== CATEGORY API ====================

export const categoryApi = {
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  getCategoryBySlug: async (slug: string) => {
    const response = await api.get(`/categories/${slug}`)
    return response.data
  },

  // Admin
  createCategory: async (data: Partial<Category>) => {
    const response = await api.post('/admin/categories', data)
    return response.data
  },

  updateCategory: async (id: string, data: Partial<Category>) => {
    const response = await api.patch(`/admin/categories/${id}`, data)
    return response.data
  },

  deleteCategory: async (id: string) => {
    const response = await api.delete(`/admin/categories/${id}`)
    return response.data
  },
}

// ==================== BANNER API ====================

export const bannerApi = {
  getBanners: async () => {
    const response = await api.get('/banners')
    return response.data
  },

  // Admin
  createBanner: async (data: Partial<Banner>) => {
    const response = await api.post('/admin/banners', data)
    return response.data
  },

  updateBanner: async (id: string, data: Partial<Banner>) => {
    const response = await api.patch(`/admin/banners/${id}`, data)
    return response.data
  },

  deleteBanner: async (id: string) => {
    const response = await api.delete(`/admin/banners/${id}`)
    return response.data
  },

  getAllBanners: async () => {
    const response = await api.get('/admin/banners/all')
    return response.data
  },
}
