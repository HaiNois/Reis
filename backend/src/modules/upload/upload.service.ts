import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { env } from '../../config/env.js'
import { logger } from '../../config/logger.js'

// ==================== TYPES ====================

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl: string
}

export interface UploadResult {
  objectKey: string
  imageUrl: string
  size: number
  contentType: string
}

export interface R2Service {
  uploadImage(buffer: Buffer, filename: string, contentType: string): Promise<UploadResult>
  deleteImage(objectKey: string): Promise<boolean>
  getImageUrl(objectKey: string): string
}

// ==================== CONFIG ====================

const r2Config: R2Config = {
  accountId: env.R2_ACCOUNT_ID,
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  bucketName: env.R2_BUCKET_NAME || 'reis-official',
  publicUrl: env.R2_PUBLIC_URL || `https://pub-${env.R2_ACCOUNT_ID}.r2.dev`,
}

// Initialize S3 client for R2 with region: "auto"
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
  forcePathStyle: true,
})

// ==================== VALIDATION ====================

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

function validateFile(buffer: Buffer, contentType: string): void {
  if (buffer.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is 5MB, got ${buffer.size} bytes`)
  }

  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`)
  }
}

// ==================== KEY GENERATION ====================

function generateObjectKey(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `products/${timestamp}-${random}.${ext}`
}

// ==================== SERVICE METHODS ====================

/**
 * Upload image to R2 using AWS SDK v3
 * Uses simple PUT (suitable for files under 5MB)
 * For larger files, use multipart upload (CreateMultipartUpload)
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  // Validate config
  if (!r2Config.accountId || !r2Config.accessKeyId || !r2Config.secretAccessKey) {
    logger.warn('R2 not configured, returning placeholder')
    return {
      objectKey: `products/placeholder-${Date.now()}.jpg`,
      imageUrl: `https://placeholder.com/products/placeholder.jpg`,
      size: buffer.size,
      contentType: 'image/jpeg',
    }
  }

  // Validate file
  
  validateFile(buffer, contentType)

  // Generate unique key
  const objectKey = generateObjectKey(filename)

  try {
    logger.info(`Uploading to R2: bucket=${r2Config.bucketName}, key=${objectKey}, size=${buffer.size}`)

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)

    const imageUrl = `${r2Config.publicUrl}/${objectKey}`
    logger.info(`Upload successful: ${imageUrl}`)

    return {
      objectKey,
      imageUrl,
      size: buffer.size,
      contentType,
    }
  } catch (error: any) {
    logger.error('R2 upload error:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    })
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Delete image from R2
 */
export async function deleteImage(objectKey: string): Promise<boolean> {
  if (!r2Config.accountId || !r2Config.accessKeyId) {
    logger.warn('R2 not configured, skipping delete')
    return true
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: objectKey,
    })

    await s3Client.send(command)
    logger.info(`Deleted from R2: ${objectKey}`)
    return true
  } catch (error: any) {
    logger.error('R2 delete error:', error.message)
    return false
  }
}

/**
 * Get public URL for an image
 */
export function getImageUrl(objectKey: string): string {
  return `${r2Config.publicUrl}/${objectKey}`
}

// Export default for convenience
export const r2Service = {
  uploadImage,
  deleteImage,
  getImageUrl,
}