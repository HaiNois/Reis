import { Router } from 'express'
import { uploadImage, deleteImage } from './upload.service.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'
import multer from 'multer'

const router = Router()

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid file type'))
  },
})

// POST /api/v1/upload/image - Upload single product image (admin only)
router.post(
  '/image',
  authenticate,
  requireAdmin,
  upload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No image file uploaded' },
      })
    }

    try {
      const result = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype)
      res.json({ success: true, data: result })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_FAILED', message: error.message },
      })
    }
  }
)

// DELETE /api/v1/upload/image - Delete product image (admin only)
router.delete(
  '/image',
  authenticate,
  requireAdmin,
  async (req, res) => {
    const { objectKey } = req.body
    if (!objectKey) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_KEY', message: 'objectKey is required' },
      })
    }

    try {
      await deleteImage(objectKey)
      res.json({ success: true, data: { deleted: true, objectKey } })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: error.message },
      })
    }
  }
)

export default router