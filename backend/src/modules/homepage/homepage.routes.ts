import { Router } from 'express'
import { homepageController } from './homepage.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin - Sections CRUD
router.get('/', authenticate, requireAdmin, homepageController.getSections)
router.get('/:id', authenticate, requireAdmin, homepageController.getSectionById)
router.post('/', authenticate, requireAdmin, homepageController.createSection)
router.patch('/:id', authenticate, requireAdmin, homepageController.updateSection)
router.delete('/:id', authenticate, requireAdmin, homepageController.deleteSection)
router.patch('/sort', authenticate, requireAdmin, homepageController.reorderSections)

// Admin - Items
router.get('/:id/items', authenticate, requireAdmin, homepageController.getItems)
router.post('/:id/items', authenticate, requireAdmin, homepageController.createItem)
router.patch('/:id/items/sort', authenticate, requireAdmin, homepageController.reorderItems)
router.patch('/:sectionId/items/:itemId', authenticate, requireAdmin, homepageController.updateItem)
router.delete('/:sectionId/items/:itemId', authenticate, requireAdmin, homepageController.deleteItem)

// Admin - Products (for PRODUCT_RAIL sections)
router.post('/:id/products', authenticate, requireAdmin, homepageController.addProduct)
router.delete('/:id/products/:productId', authenticate, requireAdmin, homepageController.removeProduct)
router.patch('/:id/products/sort', authenticate, requireAdmin, homepageController.reorderProducts)

export default router
