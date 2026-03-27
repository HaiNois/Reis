import { productService } from './product.service.js'
import {
  productFiltersSchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  updateVariantStockSchema,
  addProductImageSchema,
  createCategorySchema,
  updateCategorySchema
} from './product.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'

export class ProductController {
  // ==================== PUBLIC API ====================

  getProducts = asyncHandler(async (req, res) => {
    const filters = productFiltersSchema.parse(req.query)
    const result = await productService.getProducts(filters)

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    })
  })

  getProductBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params
    const product = await productService.getProductBySlug(slug)

    res.json({
      success: true,
      data: product,
    })
  })

  getRelatedProducts = asyncHandler(async (req, res) => {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 4
    const products = await productService.getRelatedProducts(id, limit)

    res.json({
      success: true,
      data: products,
    })
  })

  // ==================== CATEGORIES ====================

  getCategories = asyncHandler(async (req, res) => {
    const categories = await productService.getCategories()

    res.json({
      success: true,
      data: categories,
    })
  })

  getCategoryBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params
    const category = await productService.getCategoryBySlug(slug)

    res.json({
      success: true,
      data: category,
    })
  })

  createCategory = asyncHandler(async (req, res) => {
    const input = createCategorySchema.parse(req.body)
    const category = await productService.createCategory(input)

    res.status(201).json({
      success: true,
      data: category,
    })
  })

  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = updateCategorySchema.parse(req.body)
    const category = await productService.updateCategory(id, input)

    res.json({
      success: true,
      data: category,
    })
  })

  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params
    await productService.deleteCategory(id)

    res.json({
      success: true,
      data: { message: 'Category deleted successfully' },
    })
  })

  // ==================== ADMIN PRODUCTS ====================

  getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const product = await productService.getProductById(id)

    res.json({
      success: true,
      data: product,
    })
  })

  createProduct = asyncHandler(async (req, res) => {
    const input = createProductSchema.parse(req.body)
    const product = await productService.createProduct(input)

    res.status(201).json({
      success: true,
      data: product,
    })
  })

  updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = updateProductSchema.parse(req.body)
    const product = await productService.updateProduct(id, input)

    res.json({
      success: true,
      data: product,
    })
  })

  deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params
    await productService.deleteProduct(id)

    res.json({
      success: true,
      data: { message: 'Product deleted successfully' },
    })
  })

  restoreProduct = asyncHandler(async (req, res) => {
    const { id } = req.params
    const product = await productService.restoreProduct(id)

    res.json({
      success: true,
      data: product,
    })
  })

  // ==================== ADMIN VARIANTS ====================

  createVariant = asyncHandler(async (req, res) => {
    const { productId } = req.params
    const input = createVariantSchema.parse(req.body)
    const variant = await productService.createVariant(productId, input)

    res.status(201).json({
      success: true,
      data: variant,
    })
  })

  updateVariant = asyncHandler(async (req, res) => {
    const { variantId } = req.params
    const input = updateVariantSchema.parse(req.body)
    const variant = await productService.updateVariant(variantId, input)

    res.json({
      success: true,
      data: variant,
    })
  })

  updateVariantStock = asyncHandler(async (req, res) => {
    const { variantId } = req.params
    const input = updateVariantStockSchema.parse(req.body)
    const userId = (req as any).user?.id

    const variant = await productService.updateVariantStock(variantId, input, userId)

    res.json({
      success: true,
      data: variant,
    })
  })

  deleteVariant = asyncHandler(async (req, res) => {
    const { variantId } = req.params
    await productService.deleteVariant(variantId)

    res.json({
      success: true,
      data: { message: 'Variant deleted successfully' },
    })
  })

  // ==================== ADMIN IMAGES ====================

  addImage = asyncHandler(async (req, res) => {
    const { productId } = req.params
    const input = addProductImageSchema.parse(req.body)
    const image = await productService.addImage(productId, input)

    res.status(201).json({
      success: true,
      data: image,
    })
  })

  deleteImage = asyncHandler(async (req, res) => {
    const { imageId } = req.params
    await productService.deleteImage(imageId)

    res.json({
      success: true,
      data: { message: 'Image deleted successfully' },
    })
  })
}

export const productController = new ProductController()
