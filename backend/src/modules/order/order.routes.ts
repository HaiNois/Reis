import { Router } from 'express'
import { orderController } from './order.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Public routes - mounted at /api/v1/orders
router.post('/', orderController.createOrder)
router.get('/track/:labelId', orderController.trackOrder)

// Protected user routes - mounted at /api/v1/orders (after auth)
router.get('/my', authenticate, orderController.getOrders)
router.get('/:orderNumber', authenticate, orderController.getOrderByNumber)
router.post('/:id/cancel', authenticate, orderController.cancelOrder)

export default router