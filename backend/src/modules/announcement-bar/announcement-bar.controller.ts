import { announcementBarService } from './announcement-bar.service.js'
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  reorderAnnouncementSchema,
} from './announcement-bar.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'

export class AnnouncementBarController {
  // ==================== STOREFRONT ====================

  // GET /api/v1/announcement-messages
  getActiveMessages = asyncHandler(async (_req, res) => {
    const data = await announcementBarService.findActivePublic()

    res.json({ success: true, data })
  })

  // ==================== ADMIN ====================

  // GET /api/v1/admin/announcement-messages
  getAllAdmin = asyncHandler(async (req, res) => {
    const { page, limit, isActive } = req.query

    const result = await announcementBarService.findAllAdmin({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    })

    res.json({ success: true, ...result })
  })

  // GET /api/v1/admin/announcement-messages/:id
  getById = asyncHandler(async (req, res) => {
    const item = await announcementBarService.findById(req.params.id)

    res.json({ success: true, data: item })
  })

  // POST /api/v1/admin/announcement-messages
  create = asyncHandler(async (req, res) => {
    const dto = createAnnouncementSchema.parse(req.body)
    const item = await announcementBarService.create(dto)

    res.status(201).json({ success: true, data: item })
  })

  // PUT /api/v1/admin/announcement-messages/:id
  update = asyncHandler(async (req, res) => {
    const dto = updateAnnouncementSchema.parse(req.body)
    const item = await announcementBarService.update(req.params.id, dto)

    res.json({ success: true, data: item })
  })

  // DELETE /api/v1/admin/announcement-messages/:id
  remove = asyncHandler(async (req, res) => {
    await announcementBarService.remove(req.params.id)

    res.json({ success: true, data: { message: 'AnnouncementMessage deleted successfully' } })
  })

  // PATCH /api/v1/admin/announcement-messages/sort
  reorder = asyncHandler(async (req, res) => {
    const dto = reorderAnnouncementSchema.parse(req.body)
    const data = await announcementBarService.reorder(dto)

    res.json({ success: true, data })
  })
}

export const announcementBarController = new AnnouncementBarController()
