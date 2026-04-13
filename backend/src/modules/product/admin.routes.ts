import { Router } from 'express'
import { productController } from './product.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Products CRUD - mounted at /api/v1/admin/products
router.get('/', authenticate, requireAdmin, productController.getProducts)
router.post('/', authenticate, requireAdmin, productController.createProduct)
router.get('/:id', authenticate, requireAdmin, productController.getProductById)
router.patch('/:id', authenticate, requireAdmin, productController.updateProduct)
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct)
router.post('/:id/restore', authenticate, requireAdmin, productController.restoreProduct)

// Variants - /api/v1/admin/products/:productId/variants
router.post('/:productId/variants', authenticate, requireAdmin, productController.createVariant)
router.patch('/:productId/variants/:variantId', authenticate, requireAdmin, productController.updateVariant)
router.patch('/:productId/variants/:variantId/stock', authenticate, requireAdmin, productController.updateVariantStock)
router.delete('/:productId/variants/:variantId', authenticate, requireAdmin, productController.deleteVariant)

// Direct variant routes - /api/v1/admin/variants/:variantId (for direct variant updates)
router.patch('/variants/:variantId', authenticate, requireAdmin, productController.updateVariantDirect)
router.patch('/variants/:variantId/stock', authenticate, requireAdmin, productController.updateVariantStockDirect)
router.delete('/variants/:variantId', authenticate, requireAdmin, productController.deleteVariantDirect)

// Images - /api/v1/admin/products/:productId/images
router.post('/:productId/images', authenticate, requireAdmin, productController.addImage)
router.delete('/images/:imageId', authenticate, requireAdmin, productController.deleteImage)

export default router
