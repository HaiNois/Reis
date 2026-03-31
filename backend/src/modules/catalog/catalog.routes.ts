import { Router } from 'express'
import { catalogController } from './catalog.controller.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'

const router = Router()

// Public routes
router.get('/catalogs', asyncHandler(catalogController.findAll))
router.get('/catalogs/:id', asyncHandler(catalogController.findById))

// Admin routes
router.get('/admin/catalogs', asyncHandler(catalogController.findAll))
router.get('/admin/catalogs/:id', asyncHandler(catalogController.findById))
router.post('/admin/catalogs', asyncHandler(catalogController.create))
router.patch('/admin/catalogs/:id', asyncHandler(catalogController.update))
router.delete('/admin/catalogs/:id', asyncHandler(catalogController.delete))

export default router