import { homepageSectionService } from './homepage-section.service.js'
import {
  createHomepageSectionSchema,
  updateHomepageSectionSchema,
  addProductToSectionSchema,
  reorderProductsSchema,
} from './homepage-section.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'

export class HomepageSectionController {
  // Admin - List sections
  getSections = asyncHandler(async (req, res) => {
    const { page, limit, sectionType, isActive } = req.query

    const result = await homepageSectionService.getSections({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sectionType: sectionType as string | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    })

    res.json({
      success: true,
      ...result,
    })
  })

  // Admin - Get section by ID
  getSectionById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const section = await homepageSectionService.getSectionById(id)

    res.json({
      success: true,
      data: section,
    })
  })

  // Admin - Create section
  createSection = asyncHandler(async (req, res) => {
    const input = createHomepageSectionSchema.parse(req.body)
    const section = await homepageSectionService.createSection(input)

    res.status(201).json({
      success: true,
      data: section,
    })
  })

  // Admin - Update section
  updateSection = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = updateHomepageSectionSchema.parse(req.body)
    const section = await homepageSectionService.updateSection(id, input)

    res.json({
      success: true,
      data: section,
    })
  })

  // Admin - Delete section
  deleteSection = asyncHandler(async (req, res) => {
    const { id } = req.params
    await homepageSectionService.deleteSection(id)

    res.json({
      success: true,
      data: { message: 'Section deleted successfully' },
    })
  })

  // Admin - Add product to section
  addProduct = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = addProductToSectionSchema.parse(req.body)
    const section = await homepageSectionService.addProduct(id, input)

    res.status(201).json({
      success: true,
      data: section,
    })
  })

  // Admin - Reorder products
  reorderProducts = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = reorderProductsSchema.parse(req.body)
    const section = await homepageSectionService.reorderProducts(id, input)

    res.json({
      success: true,
      data: section,
    })
  })

  // Admin - Remove product from section
  removeProduct = asyncHandler(async (req, res) => {
    const { id, productId } = req.params
    await homepageSectionService.removeProduct(id, productId)

    res.json({
      success: true,
      data: { message: 'Product removed from section' },
    })
  })

  // Storefront - Get active sections
  getActiveSections = asyncHandler(async (req, res) => {
    const sections = await homepageSectionService.getActiveSections()

    res.json({
      success: true,
      data: sections,
    })
  })
}

export const homepageSectionController = new HomepageSectionController()
