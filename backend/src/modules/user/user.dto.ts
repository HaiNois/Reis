import { z } from 'zod'

export const userRoleEnum = z.enum(['ADMIN', 'CUSTOMER'])

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: userRoleEnum.optional(),
})

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().min(1).max(20).optional().nullable(),
    role: userRoleEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserRoleType = z.infer<typeof userRoleEnum>
