import { z } from 'zod'

// ==================== FEEDBACK ====================

export const createFeedbackSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerRole: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(1).max(5).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export const updateFeedbackSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerRole: z.string().optional(),
  content: z.string().min(10).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(1).max(5).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>
