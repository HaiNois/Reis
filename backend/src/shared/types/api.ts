// Standard API response format
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  meta?: PaginationMeta
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string>[]
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Request with user
export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

// Type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>