import { homepageService } from './homepage.service.js'
import {
  createHomepageSectionSchema,
  updateHomepageSectionSchema,
  reorderSectionsSchema,
  createHomepageItemSchema,
  updateHomepageItemSchema,
  reorderItemsSchema,
  addProductToSectionSchema,
  reorderSectionProductsSchema,
} from './homepage.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'

export class HomepageController {
  // ==================== SECTIONS ====================

  getSections = asyncHandler(async (req, res) => {
    const { page, limit, sectionType, isActive, search } = req.query

    const result = await homepageService.getSections({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sectionType: sectionType as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string | undefined,
    })

    res.json({
      success: true,
      ...result,
    })
  })

  getSectionById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const section = await homepageService.getSectionById(id)

    res.json({
      success: true,
      data: section,
    })
  })

  createSection = asyncHandler(async (req, res) => {
    const input = createHomepageSectionSchema.parse(req.body)
    const section = await homepageService.createSection(input)

    res.status(201).json({
      success: true,
      data: section,
    })
  })

  updateSection = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = updateHomepageSectionSchema.parse(req.body)
    const section = await homepageService.updateSection(id, input)

    res.json({
      success: true,
      data: section,
    })
  })

  deleteSection = asyncHandler(async (req, res) => {
    const { id } = req.params
    await homepageService.deleteSection(id)

    res.json({
      success: true,
      data: { message: 'Section deleted successfully' },
    })
  })

  reorderSections = asyncHandler(async (req, res) => {
    const input = reorderSectionsSchema.parse(req.body)
    const result = await homepageService.reorderSections(input)

    res.json({
      success: true,
      ...result,
    })
  })

  // ==================== ITEMS ====================

  getItems = asyncHandler(async (req, res) => {
    const { id } = req.params
    const items = await homepageService.getItems(id)

    res.json({
      success: true,
      data: items,
    })
  })

  createItem = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = createHomepageItemSchema.parse(req.body)
    const item = await homepageService.createItem(id, input)

    res.status(201).json({
      success: true,
      data: item,
    })
  })

  updateItem = asyncHandler(async (req, res) => {
    const { id: sectionId, itemId } = req.params
    const input = updateHomepageItemSchema.parse(req.body)
    const item = await homepageService.updateItem(sectionId, itemId, input)

    res.json({
      success: true,
      data: item,
    })
  })

  deleteItem = asyncHandler(async (req, res) => {
    const { id: sectionId, itemId } = req.params
    await homepageService.deleteItem(sectionId, itemId)

    res.json({
      success: true,
      data: { message: 'Item deleted successfully' },
    })
  })

  reorderItems = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = reorderItemsSchema.parse(req.body)
    const items = await homepageService.reorderItems(id, input)

    res.json({
      success: true,
      data: items,
    })
  })

  // ==================== PRODUCTS ====================

  addProduct = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = addProductToSectionSchema.parse(req.body)
    const result = await homepageService.addProduct(id, input)

    res.status(201).json({
      success: true,
      data: result,
    })
  })

  removeProduct = asyncHandler(async (req, res) => {
    const { id: sectionId, productId } = req.params
    await homepageService.removeProduct(sectionId, productId)

    res.json({
      success: true,
      data: { message: 'Product removed successfully' },
    })
  })

  reorderProducts = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = reorderSectionProductsSchema.parse(req.body)
    const result = await homepageService.reorderProducts(id, input)

    res.json({
      success: true,
      data: result,
    })
  })

  // ==================== STOREFRONT ====================

  getActiveHomepage = asyncHandler(async (req, res) => {
    const sections = await homepageService.getActiveHomepage()

    res.json({
      success: true,
      data: sections,
    })
  })

  getSectionBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params
    const section = await homepageService.getSectionBySlug(slug)

    res.json({
      success: true,
      data: section,
    })
  })
}

export const homepageController = new HomepageController()
