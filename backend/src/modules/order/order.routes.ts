import { Router } from 'express'
import { orderController } from './order.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Public routes
router.post('/orders', orderController.createOrder)

// Protected routes
router.get('/orders', authenticate, orderController.getOrders)
router.get('/orders/:orderNumber', authenticate, orderController.getOrderByNumber)
router.post('/orders/:id/cancel', authenticate, orderController.cancelOrder)

// Admin routes
router.get('/admin/orders', authenticate, requireAdmin, orderController.getAllOrders)
router.get('/admin/orders/stats', authenticate, requireAdmin, orderController.getOrderStats)
router.patch('/admin/orders/:id/status', authenticate, requireAdmin, orderController.updateOrderStatus)

export default router