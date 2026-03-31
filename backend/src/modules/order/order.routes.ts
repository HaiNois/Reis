import { Router } from 'express'
import { orderController } from './order.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Public routes - mounted at /api/v1/orders
router.post('/orders', orderController.createOrder)

// Admin routes - mounted at /api/v1/admin/orders (no /orders prefix needed)
router.get('/stats', authenticate, requireAdmin, orderController.getOrderStats)
router.get('/', authenticate, requireAdmin, orderController.getAllOrders)
router.patch('/:id/status', authenticate, requireAdmin, orderController.updateOrderStatus)

// Protected user routes - mounted at /api/v1/orders
router.get('/', authenticate, orderController.getOrders)
router.get('/:orderNumber', authenticate, orderController.getOrderByNumber)
router.post('/:id/cancel', authenticate, orderController.cancelOrder)

export default router