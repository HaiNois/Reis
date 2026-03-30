import api from './api'

// ==================== TYPES ====================

export type HomepageSectionType =
  | 'ANNOUNCEMENT_BAR'
  | 'HERO'
  | 'PRODUCT_RAIL'
  | 'MEDIA_TILES'

export type HomepageItemType = 'ANNOUNCEMENT' | 'MEDIA_TILE'

export type MediaType = 'IMAGE' | 'VIDEO'

export type LinkTarget = 'SELF' | 'BLANK'

export interface HomepageSection {
  id: string
  pageKey: string
  sectionType: HomepageSectionType
  slug: string
  title?: string
  subtitle?: string
  description?: string
  layout?: string
  configJson?: Record<string, unknown>
  isActive: boolean
  sortOrder: number
  startsAt?: string
  endsAt?: string
  createdAt: string
  updatedAt: string
  items: HomepageSectionItem[]
  products: HomepageSectionProduct[]
}

export interface HomepageSectionItem {
  id: string
  homepageSectionId: string
  itemType: HomepageItemType
  title?: string
  subtitle?: string
  description?: string
  mediaUrl?: string
  mobileMediaUrl?: string
  mediaType: MediaType
  ctaLabel?: string
  ctaUrl?: string
  linkTarget: LinkTarget
  metaJson?: Record<string, unknown>
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface HomepageSectionProduct {
  id: string
  homepageSectionId: string
  productId: string
  sortOrder: number
  badgeText?: string
  createdAt: string
  product: SectionProduct
}

export interface SectionProduct {
  id: string
  name: string
  nameEn?: string
  slug: string
  price: number
  compareAtPrice?: number
  status: string
  images: ProductImage[]
}

export interface ProductImage {
  id: string
  url: string
  position: number
}

export interface Feedback {
  id: string
  customerName: string
  customerRole?: string
  content: string
  avatarUrl?: string
  rating: number
  isFeatured: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ==================== HOMEPAGE SECTION API ====================

export const homepageSectionApi = {
  // Admin - Sections
  getSections: async (params?: {
    page?: number
    limit?: number
    sectionType?: string
    isActive?: boolean
    search?: string
  }) => {
    const response = await api.get('/admin/homepage-sections', { params })
    return response.data
  },

  getSectionById: async (id: string) => {
    const response = await api.get(`/admin/homepage-sections/${id}`)
    return response.data
  },

  createSection: async (data: Partial<HomepageSection>) => {
    const response = await api.post('/admin/homepage-sections', data)
    return response.data
  },

  updateSection: async (id: string, data: Partial<HomepageSection>) => {
    const response = await api.patch(`/admin/homepage-sections/${id}`, data)
    return response.data
  },

  deleteSection: async (id: string) => {
    const response = await api.delete(`/admin/homepage-sections/${id}`)
    return response.data
  },

  reorderSections: async (sections: { id: string; sortOrder: number }[]) => {
    const response = await api.patch('/admin/homepage-sections/sort', { sections })
    return response.data
  },

  // Admin - Items
  getItems: async (sectionId: string) => {
    const response = await api.get(`/admin/homepage-sections/${sectionId}/items`)
    return response.data
  },

  createItem: async (sectionId: string, data: Partial<HomepageSectionItem>) => {
    const response = await api.post(`/admin/homepage-sections/${sectionId}/items`, data)
    return response.data
  },

  updateItem: async (sectionId: string, itemId: string, data: Partial<HomepageSectionItem>) => {
    const response = await api.patch(`/admin/homepage-sections/${sectionId}/items/${itemId}`, data)
    return response.data
  },

  deleteItem: async (sectionId: string, itemId: string) => {
    const response = await api.delete(`/admin/homepage-sections/${sectionId}/items/${itemId}`)
    return response.data
  },

  reorderItems: async (sectionId: string, items: { id: string; sortOrder: number }[]) => {
    const response = await api.patch(`/admin/homepage-sections/${sectionId}/items/sort`, { items })
    return response.data
  },

  // Admin - Products
  addProduct: async (sectionId: string, data: { productId: string; badgeText?: string; sortOrder?: number }) => {
    const response = await api.post(`/admin/homepage-sections/${sectionId}/products`, data)
    return response.data
  },

  removeProduct: async (sectionId: string, productId: string) => {
    const response = await api.delete(`/admin/homepage-sections/${sectionId}/products/${productId}`)
    return response.data
  },

  reorderProducts: async (sectionId: string, products: { productId: string; sortOrder: number }[]) => {
    const response = await api.patch(`/admin/homepage-sections/${sectionId}/products/sort`, { products })
    return response.data
  },

  // Storefront
  getActiveHomepage: async () => {
    const response = await api.get('/storefront/homepage/homepage')
    return response.data
  },

  getSectionBySlug: async (slug: string) => {
    const response = await api.get(`/storefront/homepage/homepage/${slug}`)
    return response.data
  },
}

// ==================== FEEDBACK API ====================

export const feedbackApi = {
  getFeedback: async (params?: {
    page?: number
    limit?: number
    isFeatured?: boolean
    isActive?: boolean
  }) => {
    const response = await api.get('/admin/feedback', { params })
    return response.data
  },

  getFeedbackById: async (id: string) => {
    const response = await api.get(`/admin/feedback/${id}`)
    return response.data
  },

  createFeedback: async (data: Partial<Feedback>) => {
    const response = await api.post('/admin/feedback', data)
    return response.data
  },

  updateFeedback: async (id: string, data: Partial<Feedback>) => {
    const response = await api.patch(`/admin/feedback/${id}`, data)
    return response.data
  },

  deleteFeedback: async (id: string) => {
    const response = await api.delete(`/admin/feedback/${id}`)
    return response.data
  },

  getFeaturedFeedback: async () => {
    const response = await api.get('/admin/feedback/storefront/feedback')
    return response.data
  },
}
