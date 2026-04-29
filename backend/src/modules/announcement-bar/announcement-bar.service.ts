import prisma from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/error-handler.js'
import type {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  ReorderDto,
} from './announcement-bar.dto.js'

export class AnnouncementBarService {
  // ==================== STOREFRONT ====================

  /**
   * Return only messages that are active AND within their scheduled window.
   * Used by the public storefront endpoint.
   */
  async findActivePublic() {
    const now = new Date()

    return prisma.announcementMessage.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  // ==================== ADMIN ====================

  /**
   * Paginated list for admin, with optional isActive filter.
   */
  async findAllAdmin(params: {
    page?: number
    limit?: number
    isActive?: boolean
  }) {
    const { page = 1, limit = 20, isActive } = params
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    const [items, total] = await Promise.all([
      prisma.announcementMessage.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.announcementMessage.count({ where }),
    ])

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get a single announcement by ID; throws 404 if not found.
   */
  async findById(id: string) {
    const item = await prisma.announcementMessage.findUnique({ where: { id } })
    if (!item) {
      throw new NotFoundError('AnnouncementMessage')
    }
    return item
  }

  /**
   * Create a new announcement message.
   */
  async create(dto: CreateAnnouncementDto) {
    return prisma.announcementMessage.create({
      data: {
        textVi: dto.textVi,
        textEn: dto.textEn,
        icon: dto.icon ?? null,
        ctaTextVi: dto.ctaTextVi ?? null,
        ctaTextEn: dto.ctaTextEn ?? null,
        ctaHref: dto.ctaHref ?? null,
        variant: dto.variant,
        isActive: dto.isActive,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        sortOrder: dto.sortOrder,
      },
    })
  }

  /**
   * Partial update — only supplied fields are changed.
   */
  async update(id: string, dto: UpdateAnnouncementDto) {
    // Ensure the record exists before updating
    await this.findById(id)

    return prisma.announcementMessage.update({
      where: { id },
      data: {
        ...(dto.textVi !== undefined && { textVi: dto.textVi }),
        ...(dto.textEn !== undefined && { textEn: dto.textEn }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.ctaTextVi !== undefined && { ctaTextVi: dto.ctaTextVi }),
        ...(dto.ctaTextEn !== undefined && { ctaTextEn: dto.ctaTextEn }),
        ...(dto.ctaHref !== undefined && { ctaHref: dto.ctaHref }),
        ...(dto.variant !== undefined && { variant: dto.variant }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.startsAt !== undefined && {
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        }),
        ...(dto.endsAt !== undefined && {
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        }),
      },
    })
  }

  /**
   * Hard delete — announcements do not require soft delete.
   */
  async remove(id: string) {
    await this.findById(id)
    return prisma.announcementMessage.delete({ where: { id } })
  }

  /**
   * Bulk-update sortOrder values inside a single transaction.
   * Items not included in the payload keep their current sortOrder.
   */
  async reorder(dto: ReorderDto) {
    await prisma.$transaction(
      dto.items.map(({ id, sortOrder }) =>
        prisma.announcementMessage.update({
          where: { id },
          data: { sortOrder },
        })
      )
    )

    // Return all messages ordered by their new sortOrder
    return prisma.announcementMessage.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  }
}

export const announcementBarService = new AnnouncementBarService()
