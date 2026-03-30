import { z } from 'zod'

export const carouselConfigSchema = z.object({
  displayMode: z.enum(['carousel', 'grid']).default('carousel'),
  slidesPerViewDesktop: z.number().int().min(1).max(10).default(4),
  slidesPerViewTablet: z.number().int().min(1).max(6).default(3),
  slidesPerViewMobile: z.number().int().min(1).max(3).default(2),
  autoplay: z.boolean().default(false),
  autoplayDelay: z.number().int().min(1000).max(10000).default(3000),
  loop: z.boolean().default(true),
  showArrows: z.boolean().default(true),
  showDots: z.boolean().default(false),
  dragEnabled: z.boolean().default(true),
})

export type CarouselConfig = z.infer<typeof carouselConfigSchema>

// ==================== SECTION SCHEMAS ====================

export const createHomepageSectionSchema = z.object({
  sectionType: z.enum([
    'ANNOUNCEMENT_BAR',
    'HERO',
    'PRODUCT_RAIL',
    'MEDIA_TILES',
  ]),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  layout: z.enum(['grid', 'carousel']).optional(),
  configJson: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})

export const updateHomepageSectionSchema = createHomepageSectionSchema.partial()

export const reorderSectionsSchema = z.object({
  sections: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
})

// ==================== ITEM SCHEMAS ====================

export const createHomepageItemSchema = z.object({
  itemType: z.enum(['ANNOUNCEMENT', 'MEDIA_TILE', 'FOOTER_LINK']),
  title: z.string().max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  mobileMediaUrl: z.string().url().optional().or(z.literal('')),
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
  ctaLabel: z.string().max(100).optional(),
  ctaUrl: z.string().url().optional().or(z.literal('')),
  linkTarget: z.enum(['SELF', 'BLANK']).optional(),
  metaJson: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export const updateHomepageItemSchema = createHomepageItemSchema.partial()

export const reorderItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
})

// ==================== PRODUCT SCHEMAS ====================

export const addProductToSectionSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  badgeText: z.string().max(50).optional(),
  sortOrder: z.number().int().optional(),
})

export const reorderSectionProductsSchema = z.object({
  products: z.array(z.object({
    productId: z.string().uuid(),
    sortOrder: z.number().int(),
  })),
})

// ==================== TYPE INFERENCES ====================

export type CreateHomepageSectionInput = z.infer<typeof createHomepageSectionSchema>
export type UpdateHomepageSectionInput = z.infer<typeof updateHomepageSectionSchema>
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>

export type CreateHomepageItemInput = z.infer<typeof createHomepageItemSchema>
export type UpdateHomepageItemInput = z.infer<typeof updateHomepageItemSchema>
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>

export type AddProductToSectionInput = z.infer<typeof addProductToSectionSchema>
export type ReorderSectionProductsInput = z.infer<typeof reorderSectionProductsSchema>
