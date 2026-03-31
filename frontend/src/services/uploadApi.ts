import api from './api'

export interface UploadResponse {
  success: boolean
  data: {
    objectKey: string
    imageUrl: string
    size: number
    contentType: string
  }
}

export const uploadApi = {
  /**
   * Upload image to R2
   */
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post<UploadResponse>('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },

  /**
   * Delete image from R2
   */
  deleteImage: async (objectKey: string): Promise<{ success: boolean; data: { deleted: boolean } }> => {
    const response = await api.delete('/upload/image', {
      data: { objectKey },
    })
    return response.data
  },
}