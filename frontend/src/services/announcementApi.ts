// API client for announcement messages — public + admin endpoints
import api from './api'

// ==================== TYPES ====================

export type AnnouncementVariantApi = 'dark' | 'light' | 'accent'

export interface AnnouncementMessageEntity {
  id: string
  textVi: string
  textEn: string
  icon: string | null
  ctaTextVi: string | null
  ctaTextEn: string | null
  ctaHref: string | null
  variant: AnnouncementVariantApi
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateAnnouncementMessageDto {
  textVi: string
  textEn: string
  icon?: string | null
  ctaTextVi?: string | null
  ctaTextEn?: string | null
  ctaHref?: string | null
  variant?: AnnouncementVariantApi
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
  sortOrder?: number
}

export type UpdateAnnouncementMessageDto = Partial<CreateAnnouncementMessageDto>

export interface SortAnnouncementItem {
  id: string
  sortOrder: number
}

// ==================== API ====================

export const announcementApi = {
  // Public — fetch active messages for storefront
  getPublicMessages: async (): Promise<AnnouncementMessageEntity[]> => {
    const response = await api.get('/announcement-messages')
    return response.data?.data ?? response.data ?? []
  },

  // Admin — list all messages (active + inactive)
  getMessages: async (): Promise<AnnouncementMessageEntity[]> => {
    const response = await api.get('/admin/announcement-messages')
    return response.data?.data ?? response.data ?? []
  },

  // Admin — get single message by id
  getMessageById: async (id: string): Promise<AnnouncementMessageEntity> => {
    const response = await api.get(`/admin/announcement-messages/${id}`)
    return response.data?.data ?? response.data
  },

  // Admin — create new message
  createMessage: async (
    data: CreateAnnouncementMessageDto
  ): Promise<AnnouncementMessageEntity> => {
    const response = await api.post('/admin/announcement-messages', data)
    return response.data?.data ?? response.data
  },

  // Admin — full update
  updateMessage: async (
    id: string,
    data: UpdateAnnouncementMessageDto
  ): Promise<AnnouncementMessageEntity> => {
    const response = await api.put(`/admin/announcement-messages/${id}`, data)
    return response.data?.data ?? response.data
  },

  // Admin — delete
  deleteMessage: async (id: string): Promise<void> => {
    await api.delete(`/admin/announcement-messages/${id}`)
  },

  // Admin — reorder
  sortMessages: async (items: SortAnnouncementItem[]): Promise<void> => {
    await api.patch('/admin/announcement-messages/sort', { items })
  },
}
