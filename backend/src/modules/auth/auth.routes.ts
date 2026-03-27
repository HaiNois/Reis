import { Router } from 'express'
import { authController } from './auth.controller.js'
import { authenticate } from '../../shared/middlewares/auth.js'

const router = Router()

// Public routes
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh-token', authController.refreshToken)

// Protected routes
router.get('/profile', authenticate, authController.getProfile)
router.post('/logout', authenticate, authController.logout)

export default router