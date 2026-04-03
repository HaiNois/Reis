import api from './api'

// ==================== TYPES ====================

export interface ProductImage {
  id: string
  objectKey: string
  publicUrl: string
  sortOrder: number
  isPrimary: boolean
  altText?: string
  createdAt: string
  updatedAt?: string
}

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
  image?: string // Legacy - deprecated, use images instead
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

export interface Catalog {
  id: string
  name: string
  nameEn?: string
  slug: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt?: string
}

export interface Collection {
  id: string
  name: string
  nameEn?: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt?: string
}

// ==================== IMAGE UTILITIES ====================

// Fallback image when no product image exists
export const FALLBACK_IMAGE = '/images/products/placeholder.jpg'

/**
 * Get sorted images for a product
 * Priority: isPrimary DESC, sortOrder ASC, createdAt ASC
 */
export function getSortedImages(images: ProductImage[]): ProductImage[] {
  if (!images || images.length === 0) return []

  return [...images].sort((a, b) => {
    // Primary first
    if (a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1
    }
    // Then by sortOrder
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }
    // Then by createdAt
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

/**
 * Get main image (primary or first sorted)
 */
export function getMainImage(images: ProductImage[]): ProductImage | undefined {
  const sorted = getSortedImages(images)
  return sorted[0]
}

/**
 * Get main image URL (publicUrl) or fallback
 */
export function getMainImageUrl(images: ProductImage[]): string {
  const main = getMainImage(images)
  if (main?.publicUrl) {
    return main.publicUrl
  }
  // Fallback to legacy image field
  return FALLBACK_IMAGE
}

/**
 * Get all image URLs except main (for gallery/thumbnails)
 */
export function getThumbnailImages(images: ProductImage[]): ProductImage[] {
  const sorted = getSortedImages(images)
  return sorted.slice(1) // Skip first (main) image
}

/**
 * Build public URL from objectKey if publicUrl is missing
 * Uses R2 public URL format
 */
export function buildPublicUrl(objectKey: string): string {
  const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-55eebdd26b3c811379474db24478eabf.r2.dev'
  return `${R2_PUBLIC_URL}/${objectKey}`
}

/**
 * Get image URL - prefer publicUrl, fallback to built URL from objectKey
 */
export function getImageUrl(image: ProductImage): string {
  if (image.publicUrl) {
    return image.publicUrl
  }
  if (image.objectKey) {
    return buildPublicUrl(image.objectKey)
  }
  return FALLBACK_IMAGE
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
  addImage: async (productId: string, data: { objectKey: string; publicUrl: string; sortOrder?: number; isPrimary?: boolean; altText?: string }) => {
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

  // Category-Product Management
  getCategoryProducts: async (categoryId: string) => {
    const response = await api.get(`/admin/categories/${categoryId}/products`)
    return response.data
  },

  addProductsToCategory: async (categoryId: string, productIds: string[]) => {
    const response = await api.post(`/admin/categories/${categoryId}/products`, { productIds })
    return response.data
  },

  removeProductsFromCategory: async (categoryId: string, productIds: string[]) => {
    const response = await api.delete(`/admin/categories/${categoryId}/products`, { data: { productIds } })
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

// ==================== CATALOG API ====================

export const catalogApi = {
  // Public
  getCatalogs: async () => {
    const response = await api.get('/catalogs')
    return response.data
  },

  // Admin
  getAllCatalogs: async () => {
    const response = await api.get('/admin/catalogs')
    return response.data
  },

  getCatalogById: async (id: string) => {
    const response = await api.get(`/admin/catalogs/${id}`)
    return response.data
  },

  createCatalog: async (data: Partial<Catalog>) => {
    const response = await api.post('/admin/catalogs', data)
    return response.data
  },

  updateCatalog: async (id: string, data: Partial<Catalog>) => {
    const response = await api.patch(`/admin/catalogs/${id}`, data)
    return response.data
  },

  deleteCatalog: async (id: string) => {
    const response = await api.delete(`/admin/catalogs/${id}`)
    return response.data
  },
}

// ==================== COLLECTION API ====================

export const collectionApi = {
  // Public
  getCollections: async () => {
    const response = await api.get('/collections')
    return response.data
  },

  // Admin
  getAllCollections: async () => {
    const response = await api.get('/admin/collections')
    return response.data
  },

  getCollectionById: async (id: string) => {
    const response = await api.get(`/admin/collections/${id}`)
    return response.data
  },

  createCollection: async (data: Partial<Collection>) => {
    const response = await api.post('/admin/collections', data)
    return response.data
  },

  updateCollection: async (id: string, data: Partial<Collection>) => {
    const response = await api.patch(`/admin/collections/${id}`, data)
    return response.data
  },

  deleteCollection: async (id: string) => {
    const response = await api.delete(`/admin/collections/${id}`)
    return response.data
  },

  // Collection-Product management
  addProductToCollection: async (collectionId: string, productIds: string[], sortOrder?: number) => {
    const response = await api.post(`/admin/collections/${collectionId}/products`, { productIds, sortOrder })
    return response.data
  },

  removeProductFromCollection: async (collectionId: string, productId: string) => {
    const response = await api.delete(`/admin/collections/${collectionId}/products/${productId}`)
    return response.data
  },

  removeProductsFromCollection: async (collectionId: string, productIds: string[]) => {
    const response = await api.delete(`/admin/collections/${collectionId}/products`, { data: { productIds } })
    return response.data
  },

  getCollectionProducts: async (collectionId: string) => {
    const response = await api.get(`/admin/collections/${collectionId}/products`)
    return response.data
  },
}