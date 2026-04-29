import api from './api'

export type UserRole = 'ADMIN' | 'CUSTOMER'

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
  _count: {
    orders: number
  }
}

export interface ListUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
}

export interface PaginatedUsers {
  success: boolean
  data: AdminUser[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  phone?: string | null
  role?: UserRole
}

export const userApi = {
  listUsers: async (params?: ListUsersParams): Promise<PaginatedUsers> => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  getUser: async (id: string): Promise<{ success: boolean; data: AdminUser }> => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },

  updateUser: async (id: string, data: UpdateUserPayload): Promise<{ success: boolean; data: AdminUser }> => {
    const response = await api.patch(`/admin/users/${id}`, data)
    return response.data
  },

  deleteUser: async (id: string): Promise<{ success: boolean; data: { id: string } }> => {
    const response = await api.delete(`/admin/users/${id}`)
    return response.data
  },
}
