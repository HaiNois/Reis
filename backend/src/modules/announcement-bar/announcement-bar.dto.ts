import { z } from 'zod'

// Allowed icon identifiers for the announcement bar
const ICON_ENUM = ['truck', 'gift', 'sparkle', 'shield', 'tag', 'clock'] as const

// Visual variant of the bar
const VARIANT_ENUM = ['dark', 'light', 'accent'] as const

// Validate ctaHref: must be a full URL (http/https) or a relative path starting with /
const ctaHrefSchema = z
  .string()
  .refine(
    (val) => {
      try {
        new URL(val) // absolute URL
        return true
      } catch {
        return val.startsWith('/') // relative path
      }
    },
    { message: 'ctaHref must be a valid URL or a relative path starting with /' }
  )
  .optional()

// Shared date-range refinement: startsAt must be before endsAt when both are present
function refineDateRange<T extends { startsAt?: string | null; endsAt?: string | null }>(
  data: T,
  ctx: z.RefinementCtx
) {
  if (data.startsAt && data.endsAt) {
    if (new Date(data.startsAt) >= new Date(data.endsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startsAt must be before endsAt',
        path: ['startsAt'],
      })
    }
  }
}

// ==================== CREATE ====================

export const createAnnouncementSchema = z
  .object({
    textVi: z.string().min(1, 'textVi is required').max(200, 'textVi max 200 chars'),
    textEn: z.string().min(1, 'textEn is required').max(200, 'textEn max 200 chars'),
    icon: z.enum(ICON_ENUM).optional(),
    ctaTextVi: z.string().max(50, 'ctaTextVi max 50 chars').optional(),
    ctaTextEn: z.string().max(50, 'ctaTextEn max 50 chars').optional(),
    ctaHref: ctaHrefSchema,
    variant: z.enum(VARIANT_ENUM).default('dark'),
    isActive: z.boolean().default(true),
    startsAt: z.string().datetime().optional().nullable(),
    endsAt: z.string().datetime().optional().nullable(),
    sortOrder: z.number().int().min(0, 'sortOrder must be >= 0').default(0),
  })
  .superRefine(refineDateRange)

// ==================== UPDATE (partial) ====================

export const updateAnnouncementSchema = z
  .object({
    textVi: z.string().min(1).max(200).optional(),
    textEn: z.string().min(1).max(200).optional(),
    icon: z.enum(ICON_ENUM).nullable().optional(),
    ctaTextVi: z.string().max(50).nullable().optional(),
    ctaTextEn: z.string().max(50).nullable().optional(),
    ctaHref: ctaHrefSchema.or(z.null()).optional(),
    variant: z.enum(VARIANT_ENUM).optional(),
    isActive: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .superRefine(refineDateRange)

// ==================== REORDER ====================

export const reorderAnnouncementSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, 'id is required'),
        sortOrder: z.number().int().min(0, 'sortOrder must be >= 0'),
      })
    )
    .min(1, 'items array must not be empty'),
})

// ==================== TYPES ====================

export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementDto = z.infer<typeof updateAnnouncementSchema>
export type ReorderDto = z.infer<typeof reorderAnnouncementSchema>
