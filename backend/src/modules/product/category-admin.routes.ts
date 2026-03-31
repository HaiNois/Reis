import { Router } from 'express'
import { productController } from './product.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin - Categories - mounted at /api/v1/admin/categories
router.get('/', authenticate, requireAdmin, productController.getCategories)
router.post('/', authenticate, requireAdmin, productController.createCategory)
router.put('/:id', authenticate, requireAdmin, productController.updateCategory)
router.delete('/:id', authenticate, requireAdmin, productController.deleteCategory)

export default router
