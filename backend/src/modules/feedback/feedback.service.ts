import prisma from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/error-handler.js'
import type { CreateFeedbackInput, UpdateFeedbackInput } from './feedback.dto.js'

export class FeedbackService {
  // List all feedback with pagination
  async getFeedback(params: {
    page?: number
    limit?: number
    isFeatured?: boolean
    isActive?: boolean
  }) {
    const { page = 1, limit = 20, isFeatured, isActive } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (isActive !== undefined) where.isActive = isActive

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ])

    return {
      data: feedback,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Get single feedback by ID
  async getFeedbackById(id: string) {
    const feedback = await prisma.feedback.findUnique({
      where: { id },
    })

    if (!feedback) {
      throw new NotFoundError('Feedback')
    }

    return feedback
  }

  // Create new feedback
  async createFeedback(data: CreateFeedbackInput) {
    return prisma.feedback.create({
      data: {
        customerName: data.customerName,
        customerRole: data.customerRole,
        content: data.content,
        avatarUrl: data.avatarUrl || null,
        rating: data.rating ?? 5,
        isFeatured: data.isFeatured ?? false,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    })
  }

  // Update feedback
  async updateFeedback(id: string, data: UpdateFeedbackInput) {
    await this.getFeedbackById(id)

    return prisma.feedback.update({
      where: { id },
      data: {
        ...(data.customerName && { customerName: data.customerName }),
        ...(data.customerRole !== undefined && { customerRole: data.customerRole }),
        ...(data.content && { content: data.content }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    })
  }

  // Soft delete feedback
  async deleteFeedback(id: string) {
    await this.getFeedbackById(id)

    return prisma.feedback.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  // Get featured feedback for storefront
  async getFeaturedFeedback() {
    return prisma.feedback.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    })
  }
}

export const feedbackService = new FeedbackService()
