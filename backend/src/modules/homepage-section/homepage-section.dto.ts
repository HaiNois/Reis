import { z } from 'zod'

// ==================== HOMEPAGE SECTION ====================

export const createHomepageSectionSchema = z.object({
  sectionType: z.enum(['HERO_BANNER', 'SEASON', 'TOP_SALE', 'FEATURED_COLLECTION', 'EDITORIAL']),
  title: z.string().min(1, 'Title is required'),
  titleEn: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleEn: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  mobileImageUrl: z.string().url().optional().or(z.literal('')),
  ctaLabel: z.string().optional(),
  ctaLabelEn: z.string().optional(),
  ctaUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})

export const updateHomepageSectionSchema = z.object({
  sectionType: z.enum(['HERO_BANNER', 'SEASON', 'TOP_SALE', 'FEATURED_COLLECTION', 'EDITORIAL']).optional(),
  title: z.string().min(1).optional(),
  titleEn: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleEn: z.string().optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  mobileImageUrl: z.string().url().optional().or(z.literal('')),
  ctaLabel: z.string().optional(),
  ctaLabelEn: z.string().optional(),
  ctaUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})

export const addProductToSectionSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  sortOrder: z.number().optional(),
})

export const reorderProductsSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID'),
      sortOrder: z.number(),
    })
  ),
})

export type CreateHomepageSectionInput = z.infer<typeof createHomepageSectionSchema>
export type UpdateHomepageSectionInput = z.infer<typeof updateHomepageSectionSchema>
export type AddProductToSectionInput = z.infer<typeof addProductToSectionSchema>
export type ReorderProductsInput = z.infer<typeof reorderProductsSchema>
