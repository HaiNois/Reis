import { Router } from 'express'
import { paypalService } from '../../shared/services/paypal.service.js'
import { orderService } from '../order/order.service.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'

const router = Router()

// PayPal Routes

// Create PayPal order for checkout
router.post('/payment/paypal/create-order', asyncHandler(async (req, res) => {
  const { amount, currency = 'USD', localOrderId } = req.body

  if (!amount || amount <= 0) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_AMOUNT', message: 'Invalid amount' },
    })
    return
  }

  try {
    const order = await paypalService.createOrder(amount, currency, localOrderId)
    const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href

    res.json({
      success: true,
      data: {
        orderId: order.id,
        approvalUrl,
        status: order.status,
      },
    })
  } catch (error: any) {
    console.error('PayPal create order error:', error?.response?.data || error.message)
    res.status(500).json({
      success: false,
      error: { code: 'PAYPAL_ERROR', message: 'Failed to create PayPal order' },
    })
  }
}))

// Capture PayPal order after redirect
router.post('/payment/paypal/capture-order', asyncHandler(async (req, res) => {
  const { orderId, localOrderId } = req.body

  if (!orderId) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_ORDER_ID', message: 'Missing order ID' },
    })
    return
  }

  try {
    const capture = await paypalService.captureOrder(orderId)

    // Update order payment status if localOrderId provided
    if (localOrderId && capture.status === 'COMPLETED') {
      await orderService.updatePaymentStatus(localOrderId, 'PAID', capture.id)
    }

    res.json({
      success: true,
      data: {
        captureId: capture.id,
        status: capture.status,
        amount: capture.purchase_units[0]?.payments?.captures[0]?.amount?.value,
        currency: capture.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
      },
    })
  } catch (error: any) {
    console.error('PayPal capture error:', error?.response?.data || error.message)
    res.status(500).json({
      success: false,
      error: { code: 'PAYPAL_CAPTURE_ERROR', message: 'Failed to capture PayPal order' },
    })
  }
}))

// Get PayPal order status
router.get('/payment/paypal/order/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params

  try {
    const order = await paypalService.getOrder(orderId)
    res.json({
      success: true,
      data: order,
    })
  } catch (error: any) {
    console.error('PayPal get order error:', error?.response?.data || error.message)
    res.status(500).json({
      success: false,
      error: { code: 'PAYPAL_ERROR', message: 'Failed to get PayPal order' },
    })
  }
}))

// PayPal Webhook handler (for async notifications)
router.post('/payment/paypal/webhook', asyncHandler(async (req, res) => {
  // Verify webhook signature first
  const isValid = await paypalService.verifyWebhook(req.body, req.headers)

  if (!isValid) {
    console.error('PayPal webhook signature verification failed')
    res.status(403).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } })
    return
  }

  const webhookEvent = req.body

  console.log('PayPal webhook received:', webhookEvent.event_type)

  switch (webhookEvent.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      // Handle successful payment
      if (webhookEvent.resource?.custom_id) {
        await orderService.updatePaymentStatus(webhookEvent.resource.custom_id, 'PAID', webhookEvent.resource.id)
      }
      break
    case 'PAYMENT.CAPTURE.DENIED':
      // Handle denied payment
      if (webhookEvent.resource?.custom_id) {
        await orderService.updatePaymentStatus(webhookEvent.resource.custom_id, 'FAILED', webhookEvent.resource.id)
      }
      break
    default:
      console.log('Unhandled PayPal webhook event:', webhookEvent.event_type)
  }

  res.json({ received: true })
}))

export default router
