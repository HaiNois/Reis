import { Router } from 'express'
import { cartController } from './cart.controller.js'
import { authenticate } from '../../shared/middlewares/auth.js'

const router = Router()

// Public routes
router.get('/cart', cartController.getCart)
router.post('/cart/items', cartController.addItem)
router.put('/cart/items/:itemId', cartController.updateItem)
router.delete('/cart/items/:itemId', cartController.removeItem)
router.delete('/cart', cartController.clearCart)

// Protected routes (merge cart on login)
router.post('/cart/merge', authenticate, cartController.mergeCart)

export default router