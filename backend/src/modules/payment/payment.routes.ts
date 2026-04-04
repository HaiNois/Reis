import { Router } from 'express'
import { paypalService } from '../../shared/services/paypal.service.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'

const router = Router()

// PayPal Routes
router.post('/payment/paypal/create-order', asyncHandler(async (req, res) => {
  const { amount, currency = 'USD' } = req.body

  if (!amount || amount <= 0) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_AMOUNT', message: 'Invalid amount' },
    })
    return
  }

  const order = await paypalService.createOrder(amount, currency)

  res.json({
    success: true,
    data: {
      orderId: order.id,
      approvalUrl: order.links.find((link: any) => link.rel === 'approve')?.href,
    },
  })
}))

router.post('/payment/paypal/capture-order', asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_ORDER_ID', message: 'Missing order ID' },
    })
    return
  }

  const capture = await paypalService.captureOrder(orderId)

  res.json({
    success: true,
    data: {
      captureId: capture.id,
      status: capture.status,
      amount: capture.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      currency: capture.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
    },
  })
}))

router.get('/payment/paypal/order/:orderId', asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const order = await paypalService.getOrder(orderId)

  res.json({
    success: true,
    data: order,
  })
}))

export default router
