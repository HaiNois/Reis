import { Router } from 'express'
import { homepageSectionController } from './homepage-section.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin routes - /api/v1/admin/homepage-sections
router.get('/', authenticate, requireAdmin, homepageSectionController.getSections)
router.get('/:id', authenticate, requireAdmin, homepageSectionController.getSectionById)
router.post('/', authenticate, requireAdmin, homepageSectionController.createSection)
router.patch('/:id', authenticate, requireAdmin, homepageSectionController.updateSection)
router.delete('/:id', authenticate, requireAdmin, homepageSectionController.deleteSection)

// Admin - Product management in section
router.post('/:id/products', authenticate, requireAdmin, homepageSectionController.addProduct)
router.patch('/:id/products/sort', authenticate, requireAdmin, homepageSectionController.reorderProducts)
router.delete('/:id/products/:productId', authenticate, requireAdmin, homepageSectionController.removeProduct)

// Storefront routes - /api/v1/storefront/homepage
router.get('/storefront/homepage', homepageSectionController.getActiveSections)

export default router
