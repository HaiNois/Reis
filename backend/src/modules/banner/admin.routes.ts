import { Router } from 'express'
import { bannerController } from './banner.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin - Banners - mounted at /api/v1/admin/banners
router.post('/', authenticate, requireAdmin, bannerController.createBanner)
router.put('/:id', authenticate, requireAdmin, bannerController.updateBanner)
router.delete('/:id', authenticate, requireAdmin, bannerController.deleteBanner)
router.get('/all', authenticate, requireAdmin, bannerController.getAllBanners)

export default router
