import { Router } from 'express'
import { uploadImage, deleteImage } from './upload.service.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'
import multer from 'multer'
import { logger } from '../../config/logger.js'

const router = Router()

// Configure multer for memory storage (pass to service as Buffer)
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB - matches service validation
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF'))
    }
  },
})

// ==================== ROUTES ====================

// POST /api/v1/upload/image - Upload single product image
router.post(
  '/image',
  authenticate,
  requireAdmin,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No image file uploaded' },
        })
      }

      // Thin controller: delegate to service
      const result = await uploadImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      )

      res.json({
        success: true,
        data: result,
      })
    } catch (error: any) {
      logger.error('Upload controller error:', error.message)
      res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_FAILED', message: error.message },
      })
    }
  }
)

// DELETE /api/v1/upload/image - Delete product image
router.delete(
  '/image',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { objectKey } = req.body

      if (!objectKey) {
        return res.status(400).json({
          success: false,
          error: { code: 'MISSING_KEY', message: 'objectKey is required' },
        })
      }

      // Thin controller: delegate to service
      await deleteImage(objectKey)

      res.json({
        success: true,
        data: { deleted: true, objectKey },
      })
    } catch (error: any) {
      logger.error('Delete controller error:', error.message)
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: error.message },
      })
    }
  }
)

export default router