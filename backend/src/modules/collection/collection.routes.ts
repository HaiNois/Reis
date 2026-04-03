import { Router } from 'express'
import { collectionController } from './collection.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Public routes
router.get('/', collectionController.findAll)
router.get('/:id', collectionController.findById)
router.get('/:id/products', collectionController.getProducts)

// Protected routes (admin)
router.post('/', authenticate, requireAdmin, collectionController.create)
router.put('/:id', authenticate, requireAdmin, collectionController.update)
router.delete('/:id', authenticate, requireAdmin, collectionController.delete)
router.post('/:id/products', authenticate, requireAdmin, collectionController.addProducts)
router.delete('/:id/products', authenticate, requireAdmin, collectionController.removeProducts)

export default router
