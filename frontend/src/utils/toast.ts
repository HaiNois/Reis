import { toast } from 'sonner'

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string, description?: string) => toast.error(message, { description }),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  loading: (message: string) => toast.loading(message),
}

// Helper to extract error message from backend response
export const getErrorMessage = (error: unknown): { message: string; details?: string[] } => {
  if (typeof error === 'string') return { message: error }
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response
    if (response?.data?.error?.details) {
      const details = response.data.error.details.map((d: { field: string; message: string }) =>
        `${d.field}: ${d.message}`
      )
      return {
        message: response.data.error.message || 'Validation failed',
        details,
      }
    }
    if (response?.data?.error?.message) {
      return { message: response.data.error.message }
    }
    if (response?.data?.error) {
      return {
        message: typeof response.data.error === 'string'
          ? response.data.error
          : response.data.error.message || JSON.stringify(response.data.error),
      }
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return { message: (error as any).message }
  }
  return { message: 'An error occurred' }
}

// Helper to handle API errors and show toast
export const handleApiError = (error: unknown, defaultMessage = 'Operation failed'): string => {
  const { message, details } = getErrorMessage(error)
  if (details && details.length > 0) {
    showToast.error(defaultMessage, details.join('\n'))
  } else {
    showToast.error(defaultMessage, message)
  }
  return message
}