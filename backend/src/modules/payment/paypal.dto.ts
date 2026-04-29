import { z } from 'zod'

const paypalItemSchema = z.object({
  variantId: z.string().uuid('variantId must be a valid UUID'),
  quantity: z.number().int().positive('quantity must be a positive integer'),
})

export const createPaypalOrderSchema = z
  .object({
    amount: z.number().positive('Amount must be positive').optional(),
    currency: z.string().length(3, 'Currency must be ISO 4217 code').default('USD'),
    localOrderId: z.string().uuid('localOrderId must be a valid UUID').optional(),
    items: z.array(paypalItemSchema).min(1).optional(),
  })
  .refine((data) => data.amount !== undefined || (data.items && data.items.length > 0), {
    message: 'Either amount or items must be provided',
  })

export const capturePaypalOrderSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  localOrderId: z.string().uuid('localOrderId must be a valid UUID').optional(),
  items: z.array(paypalItemSchema).min(1).optional(),
  notes: z.string().optional(),
})

export const paypalOrderIdParamSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
})

// Loose schema: PayPal webhook payload shape varies per event_type.
// We only require event_type and optional resource fields used downstream.
export const paypalWebhookEventSchema = z
  .object({
    event_type: z.string().min(1),
    resource: z
      .object({
        id: z.string().optional(),
        custom_id: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export type PaypalItemInput = z.infer<typeof paypalItemSchema>
export type CreatePaypalOrderInput = z.infer<typeof createPaypalOrderSchema>
export type CapturePaypalOrderInput = z.infer<typeof capturePaypalOrderSchema>
export type PaypalOrderIdParam = z.infer<typeof paypalOrderIdParamSchema>
export type PaypalWebhookEvent = z.infer<typeof paypalWebhookEventSchema>
