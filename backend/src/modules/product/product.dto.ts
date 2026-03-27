import { z } from 'zod'

// ==================== PRODUCT ====================

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  shortDescription: z.string().optional(),
  shortDescriptionEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  material: z.string().optional(),
  materialEn: z.string().optional(),
  careGuide: z.string().optional(),
  careGuideEn: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'popular']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ==================== VARIANT ====================

export const createVariantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  price: z.number().positive('Price must be positive'),
  salePrice: z.number().positive().optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative').default(0),
  isActive: z.boolean().optional(),
})

export const updateVariantSchema = createVariantSchema.partial()

export const updateVariantStockSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  note: z.string().optional(),
})

// ==================== IMAGES ====================

export const addProductImageSchema = z.object({
  url: z.string().url('Valid URL is required'),
  position: z.number().int().min(0).default(0),
})

// ==================== CATEGORY ====================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

// ==================== TYPES ====================

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductFilters = z.infer<typeof productFiltersSchema>
export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>
export type UpdateVariantStockInput = z.infer<typeof updateVariantStockSchema>
export type AddProductImageInput = z.infer<typeof addProductImageSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
