import { Router } from 'express'
import { feedbackController } from './feedback.controller.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

const router = Router()

// Admin routes - /api/v1/admin/feedback
router.get('/', authenticate, requireAdmin, feedbackController.getFeedback)
router.get('/:id', authenticate, requireAdmin, feedbackController.getFeedbackById)
router.post('/', authenticate, requireAdmin, feedbackController.createFeedback)
router.patch('/:id', authenticate, requireAdmin, feedbackController.updateFeedback)
router.delete('/:id', authenticate, requireAdmin, feedbackController.deleteFeedback)

// Storefront routes - /api/v1/storefront/feedback
router.get('/storefront/feedback', feedbackController.getFeaturedFeedback)

export default router
