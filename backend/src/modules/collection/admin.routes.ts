import { Router } from 'express'
import { collectionController } from './collection.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin - Collections - mounted at /api/v1/admin/collections
router.get('/', authenticate, requireAdmin, collectionController.findAll)
router.get('/:id', authenticate, requireAdmin, collectionController.findById)
router.post('/', authenticate, requireAdmin, collectionController.create)
router.put('/:id', authenticate, requireAdmin, collectionController.update)
router.delete('/:id', authenticate, requireAdmin, collectionController.delete)
router.post('/:id/products', authenticate, requireAdmin, collectionController.addProducts)
router.delete('/:id/products', authenticate, requireAdmin, collectionController.removeProducts)
router.get('/:id/products', authenticate, requireAdmin, collectionController.getProducts)

export default router