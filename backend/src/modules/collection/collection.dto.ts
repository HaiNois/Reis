import { z } from 'zod'

// Collection DTOs
export const CreateCollectionDto = z.object({
  catalogId: z.string().uuid(),
  name: z.string().min(1),
  nameEn: z.string().optional(),
  slug: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const UpdateCollectionDto = CreateCollectionDto.partial()

export const CollectionResponse = z.object({
  id: z.string(),
  catalogId: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
  slug: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type CreateCollectionDtoType = z.infer<typeof CreateCollectionDto>
export type UpdateCollectionDtoType = z.infer<typeof UpdateCollectionDto>
export type CollectionResponseType = z.infer<typeof CollectionResponse>
