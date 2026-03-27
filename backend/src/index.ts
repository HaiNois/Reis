import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { errorHandler } from './shared/utils/error-handler.js'

// Import routes
import authRoutes from './modules/auth/auth.routes.js'
import productRoutes from './modules/product/product.routes.js'
import categoryRoutes from './modules/product/category.routes.js'
import orderRoutes from './modules/order/order.routes.js'
import cartRoutes from './modules/cart/cart.routes.js'
import bannerRoutes from './modules/banner/banner.routes.js'

// Homepage CMS
import homepageRoutes from './modules/homepage/homepage.routes.js'
import homepageStorefrontRoutes from './modules/homepage/storefront.routes.js'

// Admin routes
import productAdminRoutes from './modules/product/admin.routes.js'
import categoryAdminRoutes from './modules/product/category-admin.routes.js'
import bannerAdminRoutes from './modules/banner/admin.routes.js'
import feedbackRoutes from './modules/feedback/feedback.routes.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
})

const adminLimiter = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(env.RATE_LIMIT_ADMIN_MAX_REQUESTS),
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
})

app.use('/api', limiter)
app.use('/api/admin', adminLimiter)

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/products', productRoutes)
app.use('/api/v1/categories', categoryRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/cart', cartRoutes)
app.use('/api/v1/banners', bannerRoutes)

// Admin routes
app.use('/api/v1/admin/products', productAdminRoutes)
app.use('/api/v1/admin/categories', categoryAdminRoutes)
app.use('/api/v1/admin/banners', bannerAdminRoutes)
app.use('/api/v1/admin/homepage-sections', homepageRoutes)

// Storefront routes
app.use('/api/v1/storefront/homepage', homepageStorefrontRoutes)
app.use('/api/v1/admin/feedback', feedbackRoutes)

// Error handling
app.use(errorHandler)

// Start server
const PORT = env.PORT

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`)
})

export default app