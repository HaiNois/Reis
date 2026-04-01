import { Router } from 'express'
import { productController } from './product.controller.js'

const router = Router()

// Public Categories - mounted at /api/v1/categories
router.get('/', productController.getCategories)
router.get('/:slug', productController.getCategoryBySlug)

export default router
