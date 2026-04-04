import { env } from '../../config/env.js'

const R2_PUBLIC_URL = env.R2_PUBLIC_URL || 'https://pub-55eebdd26b3c811379474db24478eabf.r2.dev'

/**
 * Build public URL from R2 object key
 */
export function buildR2PublicUrl(objectKey: string): string {
  return `${R2_PUBLIC_URL}/${objectKey}`
}

/**
 * Transform single image to include publicUrl
 */
export function transformImage(img: any): any {
  // Priority: publicUrl > objectKey > url
  let publicUrl = img.publicUrl
  if (!publicUrl && img.objectKey) {
    publicUrl = buildR2PublicUrl(img.objectKey)
  }
  if (!publicUrl && img.url) {
    publicUrl = img.url
  }
  return { ...img, publicUrl }
}

/**
 * Transform product images to include publicUrl
 */
export function transformProductImages(images: any[]): any[] {
  return images.map((img) => transformImage(img))
}

/**
 * Transform collection to include imageUrl
 */
export function transformCollection(collection: any): any {
  let imageUrl = collection.imageUrl
  if (!imageUrl && collection.image) {
    imageUrl = buildR2PublicUrl(collection.image)
  }
  if (!imageUrl && collection.imageUrl) {
    imageUrl = collection.imageUrl
  }
  return { ...collection, imageUrl }
}
