import { Router } from 'express'
import { orderController } from './order.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin order routes - mounted at /api/v1/admin/orders
router.get('/stats', authenticate, requireAdmin, orderController.getOrderStats)
router.get('/', authenticate, requireAdmin, orderController.getAllOrders)
router.patch('/:id/status', authenticate, requireAdmin, orderController.updateOrderStatus)

export default router
