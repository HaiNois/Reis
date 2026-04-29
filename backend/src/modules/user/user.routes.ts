import { Router } from 'express'
import { userController } from './user.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin user routes - mounted at /api/v1/admin/users
router.get('/', authenticate, requireAdmin, userController.listUsers)
router.get('/:id', authenticate, requireAdmin, userController.getUserById)
router.patch('/:id', authenticate, requireAdmin, userController.updateUser)
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser)

export default router
