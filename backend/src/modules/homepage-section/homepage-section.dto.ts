import { z } from 'zod'

// ==================== HOMEPAGE SECTION ====================

export const createHomepageSectionSchema = z.object({
  sectionType: z.enum(['HERO', 'PRODUCT_RAIL', 'MEDIA_TILES', 'NEW_SEASON_ARRIVALS', 'STATIC_BANNER', 'CATEGORY_SHOWCASE']),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  layout: z.string().optional(),
  configJson: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})

export const updateHomepageSectionSchema = z.object({
  sectionType: z.enum(['HERO', 'PRODUCT_RAIL', 'MEDIA_TILES', 'NEW_SEASON_ARRIVALS', 'STATIC_BANNER', 'CATEGORY_SHOWCASE']).optional(),
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  layout: z.string().optional(),
  configJson: z.record(z.unknown()).optional(),
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

export const reorderSectionsSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().uuid('Invalid section ID'),
      sortOrder: z.number(),
    })
  ),
})

// ==================== SECTION ITEMS ====================

export const createHomepageSectionItemSchema = z.object({
  itemType: z.enum(['MEDIA_TILE', 'PRODUCT', 'COLLECTION', 'BANNER']),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  mediaUrl: z.string().optional().or(z.literal('')),
  mobileMediaUrl: z.string().optional().or(z.literal('')),
  mediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional().or(z.literal('')),
  linkTarget: z.enum(['SELF', 'BLANK']).default('SELF'),
  collectionId: z.string().uuid().optional(),
  metaJson: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export const updateHomepageSectionItemSchema = z.object({
  itemType: z.enum(['MEDIA_TILE', 'PRODUCT', 'COLLECTION', 'BANNER']).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  mediaUrl: z.string().optional().or(z.literal('')),
  mobileMediaUrl: z.string().optional().or(z.literal('')),
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional().or(z.literal('')),
  linkTarget: z.enum(['SELF', 'BLANK']).optional(),
  collectionId: z.string().uuid().nullable().optional(),
  metaJson: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export const reorderItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid('Invalid item ID'),
      sortOrder: z.number(),
    })
  ),
})

// Sync (replace-all) items for a section
export const syncItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid().optional(),
      itemType: z.enum(['MEDIA_TILE', 'PRODUCT', 'COLLECTION', 'BANNER']),
      title: z.string().optional().nullable(),
      subtitle: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      mediaUrl: z.string().optional().nullable().or(z.literal('')),
      mobileMediaUrl: z.string().optional().nullable().or(z.literal('')),
      mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
      ctaLabel: z.string().optional().nullable(),
      ctaUrl: z.string().optional().nullable().or(z.literal('')),
      linkTarget: z.enum(['SELF', 'BLANK']).optional(),
      collectionId: z.string().uuid().nullable().optional(),
      metaJson: z.record(z.unknown()).nullable().optional(),
      isActive: z.boolean().optional(),
    })
  ),
})

export type CreateHomepageSectionInput = z.infer<typeof createHomepageSectionSchema>
export type UpdateHomepageSectionInput = z.infer<typeof updateHomepageSectionSchema>
export type AddProductToSectionInput = z.infer<typeof addProductToSectionSchema>
export type ReorderProductsInput = z.infer<typeof reorderProductsSchema>
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>
export type CreateHomepageSectionItemInput = z.infer<typeof createHomepageSectionItemSchema>
export type UpdateHomepageSectionItemInput = z.infer<typeof updateHomepageSectionItemSchema>
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>
export type SyncItemsInput = z.infer<typeof syncItemsSchema>
