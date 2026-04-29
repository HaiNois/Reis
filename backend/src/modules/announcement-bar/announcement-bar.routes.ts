import { Router } from 'express'
import { announcementBarController } from './announcement-bar.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

// ========================================================
// Public storefront router
// Mounted at: /api/v1/announcement-messages
// ========================================================
export const announcementPublicRouter = Router()

announcementPublicRouter.get('/', announcementBarController.getActiveMessages)

// ========================================================
// Admin router
// Mounted at: /api/v1/admin/announcement-messages
// All routes require JWT + ADMIN role
// ========================================================
export const announcementAdminRouter = Router()

// IMPORTANT: /sort must be registered BEFORE /:id so Express does not
// match the literal string "sort" as a cuid parameter.
announcementAdminRouter.patch(
  '/sort',
  authenticate,
  requireAdmin,
  announcementBarController.reorder
)

announcementAdminRouter.get('/', authenticate, requireAdmin, announcementBarController.getAllAdmin)
announcementAdminRouter.get('/:id', authenticate, requireAdmin, announcementBarController.getById)
announcementAdminRouter.post('/', authenticate, requireAdmin, announcementBarController.create)
announcementAdminRouter.put('/:id', authenticate, requireAdmin, announcementBarController.update)
announcementAdminRouter.delete('/:id', authenticate, requireAdmin, announcementBarController.remove)
