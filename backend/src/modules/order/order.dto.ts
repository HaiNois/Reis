import { z } from 'zod'

export const createOrderSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().uuid('Invalid variant ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),

  paymentMethod: z.enum(['COD', 'BANK_TRANSFER']).default('COD'),

  shippingFirstName: z.string().min(1, 'First name is required'),
  shippingLastName: z.string().min(1, 'Last name is required'),
  shippingPhone: z.string().min(1, 'Phone is required'),
  shippingAddress: z.string().min(1, 'Address is required'),
  shippingWard: z.string().min(1, 'Ward is required'),
  shippingDistrict: z.string().min(1, 'District is required'),
  shippingProvince: z.string().min(1, 'Province is required'),

  notes: z.string().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
})

export const orderFiltersSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type OrderFilters = z.infer<typeof orderFiltersSchema>