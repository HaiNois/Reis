import { Router } from 'express'
import { AxiosError } from 'axios'
import prisma from '../../config/database.js'
import { paypalService } from '../../shared/services/paypal.service.js'
import { orderService } from '../order/order.service.js'
import { asyncHandler, AppError, ValidationError } from '../../shared/utils/error-handler.js'
import { logger } from '../../config/logger.js'
import { optionalAuth } from '../../shared/middlewares/auth.js'
import {
  createPaypalOrderSchema,
  capturePaypalOrderSchema,
  paypalOrderIdParamSchema,
  paypalWebhookEventSchema,
  type PaypalItemInput,
} from './paypal.dto.js'

const router = Router()

// Helper: turn axios errors into a uniform AppError the global handler can format.
function toPaypalApiError(error: unknown, code: string, message: string): AppError {
  const err = error as AxiosError
  logger.error(`${message}`, {
    message: err.message,
    data: err.response?.data,
  })
  return new AppError(message, 502, code)
}

// Compute amount server-side from items (authoritative — never trust client totals).
// PayPal charges in USD, so we read variant.priceUsd. If missing for any variant,
// reject with a clear error so the client can fall back to COD.
async function computeAmountFromItems(
  items: PaypalItemInput[],
  currency: string
): Promise<number> {
  const variantIds = items.map((i) => i.variantId)
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
  })
  if (variants.length !== items.length) {
    throw new ValidationError('Some variants do not exist')
  }

  const useUsd = currency === 'USD'

  let total = 0
  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId)
    if (!variant) continue
    if (variant.quantity < item.quantity) {
      throw new ValidationError(`Insufficient stock for variant ${variant.sku}`)
    }

    const unitPrice = useUsd ? variant.priceUsd : variant.price
    if (unitPrice == null) {
      throw new ValidationError(
        `Variant ${variant.sku} is missing a USD price and cannot be paid via PayPal`
      )
    }

    total += Number(unitPrice) * item.quantity
  }
  return Number(total.toFixed(2))
}

// PayPal Routes

// Create PayPal order for checkout
router.post(
  '/payment/paypal/create-order',
  asyncHandler(async (req, res) => {
    const { amount, currency, localOrderId, items } = createPaypalOrderSchema.parse(req.body)

    const finalAmount = items ? await computeAmountFromItems(items, currency) : amount!

    try {
      const order = await paypalService.createOrder(finalAmount, currency, localOrderId)
      const approvalUrl = order.links.find((link) => link.rel === 'approve')?.href

      res.json({
        success: true,
        data: {
          orderId: order.id,
          approvalUrl,
          status: order.status,
          amount: finalAmount,
          currency,
        },
      })
    } catch (error) {
      throw toPaypalApiError(error, 'PAYPAL_ERROR', 'Failed to create PayPal order')
    }
  })
)

// Capture PayPal order after approval
router.post(
  '/payment/paypal/capture-order',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { orderId, localOrderId, items, notes } = capturePaypalOrderSchema.parse(req.body)

    try {
      const capture = await paypalService.captureOrder(orderId)
      const isCompleted = capture.status === 'COMPLETED'

      // Mode A — existing local order: just update its payment status.
      if (localOrderId) {
        if (isCompleted) {
          await orderService.updatePaymentStatus(localOrderId, 'PAID', capture.id)
        }
        res.json({
          success: true,
          data: {
            captureId: capture.id,
            status: capture.status,
            localOrderId,
            amount: capture.purchase_units[0]?.payments?.captures[0]?.amount?.value,
            currency: capture.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
          },
        })
        return
      }

      // Mode B — create a new local order from PayPal's captured data.
      if (!isCompleted) {
        throw new AppError('PayPal capture did not complete', 502, 'PAYPAL_CAPTURE_ERROR')
      }
      if (!items || items.length === 0) {
        throw new ValidationError('items are required when localOrderId is not provided')
      }

      const shipping = capture.purchase_units[0]?.shipping
      const payer = capture.payer
      const fullName = shipping?.name?.full_name || ''
      const [firstFromFull, ...restFromFull] = fullName.split(' ')
      const firstName = payer?.name?.given_name || firstFromFull || 'PayPal'
      const lastName = payer?.name?.surname || restFromFull.join(' ') || 'Customer'
      const addr = shipping?.address
      const addressLine = [addr?.address_line_1, addr?.address_line_2].filter(Boolean).join(', ')
      const city = addr?.admin_area_2 || addr?.admin_area_1 || ''
      const country = addr?.country_code || ''
      const phone = payer?.phone?.phone_number?.national_number || ''

      if (!addressLine || !city || !country) {
        throw new AppError(
          'PayPal did not return a shipping address',
          502,
          'PAYPAL_MISSING_ADDRESS'
        )
      }

      const order = await orderService.createPaidOrderFromPaypal({
        userId: req.user?.userId ?? null,
        items,
        shippingFirstName: firstName,
        shippingLastName: lastName,
        shippingPhone: phone,
        shippingAddress: addressLine,
        shippingCity: city,
        shippingCountry: country,
        paypalCaptureId: capture.id,
        notes,
      })

      res.json({
        success: true,
        data: {
          captureId: capture.id,
          status: capture.status,
          localOrderId: order.id,
          orderNumber: order.orderNumber,
          amount: capture.purchase_units[0]?.payments?.captures[0]?.amount?.value,
          currency: capture.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
        },
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw toPaypalApiError(error, 'PAYPAL_CAPTURE_ERROR', 'Failed to capture PayPal order')
    }
  })
)

// Get PayPal order status
router.get(
  '/payment/paypal/order/:orderId',
  asyncHandler(async (req, res) => {
    const { orderId } = paypalOrderIdParamSchema.parse(req.params)

    try {
      const order = await paypalService.getOrder(orderId)
      res.json({
        success: true,
        data: order,
      })
    } catch (error) {
      throw toPaypalApiError(error, 'PAYPAL_ERROR', 'Failed to get PayPal order')
    }
  })
)

// PayPal Webhook handler (for async notifications)
router.post(
  '/payment/paypal/webhook',
  asyncHandler(async (req, res) => {
    const isValid = await paypalService.verifyWebhook(
      req.body,
      req.headers as Record<string, unknown>
    )

    if (!isValid) {
      logger.error('PayPal webhook signature verification failed')
      res.status(403).json({
        success: false,
        error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' },
      })
      return
    }

    const parsed = paypalWebhookEventSchema.safeParse(req.body)
    if (!parsed.success) {
      logger.warn('PayPal webhook payload shape unexpected', {
        issues: parsed.error.issues,
      })
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_WEBHOOK_PAYLOAD', message: 'Invalid webhook payload' },
      })
      return
    }

    const webhookEvent = parsed.data
    logger.info(`PayPal webhook received: ${webhookEvent.event_type}`)

    switch (webhookEvent.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        if (webhookEvent.resource?.custom_id && webhookEvent.resource?.id) {
          await orderService.updatePaymentStatus(
            webhookEvent.resource.custom_id,
            'PAID',
            webhookEvent.resource.id
          )
        }
        break
      case 'PAYMENT.CAPTURE.DENIED':
        if (webhookEvent.resource?.custom_id && webhookEvent.resource?.id) {
          await orderService.updatePaymentStatus(
            webhookEvent.resource.custom_id,
            'FAILED',
            webhookEvent.resource.id
          )
        }
        break
      default:
        logger.info(`Unhandled PayPal webhook event: ${webhookEvent.event_type}`)
    }

    res.json({ received: true })
  })
)

export default router
