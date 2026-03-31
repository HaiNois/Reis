import { useState, useRef } from 'react'
import { uploadApi } from '@/services/uploadApi'

interface ImageUploadProps {
  value?: string
  onChange?: (url: string) => void
  multiple?: boolean
  maxImages?: number
}

interface UploadedImage {
  url: string
  objectKey?: string
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxImages = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<UploadedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse initial value
  const getImages = (): string[] => {
    if (!value) return []
    if (multiple) {
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    }
    return [value]
  }

  const initialImages = getImages()

  // Create preview URL for file
  const createPreview = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const currentImages = multiple ? getImages() : []

    if (multiple && currentImages.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadedResults: UploadedImage[] = []
      const totalFiles = fileArray.length

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed')
          continue
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name}: File size must be less than 5MB`)
          continue
        }

        // Create preview for file
        createPreview(file)

        try {
          const result = await uploadApi.uploadImage(file)
          uploadedResults.push({
            url: result.data.imageUrl,
            objectKey: result.data.objectKey,
          })
        } catch (uploadErr) {
          console.error(`Failed to upload ${file.name}:`, uploadErr)
          setError(`Failed to upload ${file.name}`)
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      }

      if (multiple) {
        const newImages = [...currentImages, ...uploadedResults.map(r => r.url)].slice(0, maxImages)
        onChange?.(JSON.stringify(newImages))
        // Keep previews for display
        setPreviews(uploadedResults)
      } else if (uploadedResults.length > 0) {
        onChange?.(uploadedResults[0].url)
        setPreviews(uploadedResults)
      }
    } catch (err) {
      setError('Failed to upload image. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (url: string, index?: number) => {
    if (multiple) {
      const currentImages = getImages()
      const newImages = currentImages.filter((img, i) => img !== url && i !== index)
      onChange?.(newImages.length > 0 ? JSON.stringify(newImages) : '')
      // Update previews
      setPreviews(prev => prev.filter(p => p.url !== url))
    } else {
      onChange?.('')
      setPreviews([])
    }
  }

  const allImages = [...previews.map(p => p.url), ...initialImages.filter(url => !previews.some(p => p.url === url))]
  const displayImages = multiple ? allImages : (previews.length > 0 ? [previews[0].url] : initialImages)

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <label
          className={`
            flex items-center justify-center px-4 py-2
            bg-black text-white rounded-lg cursor-pointer
            hover:bg-gray-800 transition-colors
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Uploading {uploadProgress}%
            </span>
          ) : (
            <span>+ Add Images</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </label>

        {multiple && (
          <span className="text-sm text-gray-500">
            {displayImages.length}/{maxImages} images
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Image Grid Preview */}
      {displayImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {displayImages.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border"
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Preview button */}
                <button
                  type="button"
                  onClick={() => window.open(url, '_blank')}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-200"
                  title="Preview"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(url, index)}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Image index badge */}
              {multiple && (
                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}