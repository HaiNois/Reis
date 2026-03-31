import { z } from 'zod'

export const CreateCatalogDto = z.object({
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export const UpdateCatalogDto = CreateCatalogDto.partial()

export type CreateCatalogDto = z.infer<typeof CreateCatalogDto>
export type UpdateCatalogDto = z.infer<typeof UpdateCatalogDto>