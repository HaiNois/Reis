import { feedbackService } from './feedback.service.js'
import { createFeedbackSchema, updateFeedbackSchema } from './feedback.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'

export class FeedbackController {
  // Admin - List feedback
  getFeedback = asyncHandler(async (req, res) => {
    const { page, limit, isFeatured, isActive } = req.query

    const result = await feedbackService.getFeedback({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    })

    res.json({
      success: true,
      ...result,
    })
  })

  // Admin - Get feedback by ID
  getFeedbackById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const feedback = await feedbackService.getFeedbackById(id)

    res.json({
      success: true,
      data: feedback,
    })
  })

  // Admin - Create feedback
  createFeedback = asyncHandler(async (req, res) => {
    const input = createFeedbackSchema.parse(req.body)
    const feedback = await feedbackService.createFeedback(input)

    res.status(201).json({
      success: true,
      data: feedback,
    })
  })

  // Admin - Update feedback
  updateFeedback = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = updateFeedbackSchema.parse(req.body)
    const feedback = await feedbackService.updateFeedback(id, input)

    res.json({
      success: true,
      data: feedback,
    })
  })

  // Admin - Delete feedback
  deleteFeedback = asyncHandler(async (req, res) => {
    const { id } = req.params
    await feedbackService.deleteFeedback(id)

    res.json({
      success: true,
      data: { message: 'Feedback deleted successfully' },
    })
  })

  // Storefront - Get featured feedback
  getFeaturedFeedback = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.getFeaturedFeedback()

    res.json({
      success: true,
      data: feedback,
    })
  })
}

export const feedbackController = new FeedbackController()
