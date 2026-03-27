import { Router } from 'express'
import { productController } from './product.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin - Categories - mounted at /api/v1/admin/categories
router.post('/categories', authenticate, requireAdmin, productController.createCategory)
router.patch('/categories/:id', authenticate, requireAdmin, productController.updateCategory)
router.delete('/categories/:id', authenticate, requireAdmin, productController.deleteCategory)

export default router
