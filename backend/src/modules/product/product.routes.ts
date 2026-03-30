import { Router } from 'express'
import { productController } from './product.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Public Products routes - mounted at /api/v1/products
router.get('/', productController.getProducts)
router.get('/:slug', productController.getProductBySlug)
router.get('/:id/related', productController.getRelatedProducts)

// Public Categories - mounted at /api/v1/categories
router.get('/categories', productController.getCategories)
router.get('/categories/:slug', productController.getCategoryBySlug)

export default router
