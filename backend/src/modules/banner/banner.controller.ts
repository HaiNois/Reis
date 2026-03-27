import { bannerService } from './banner.service.js'
import { createBannerSchema, updateBannerSchema } from './banner.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'
import { requireAdmin } from '../../shared/middlewares/auth.js'

export class BannerController {
  getBanners = asyncHandler(async (req, res) => {
    const banners = await bannerService.getBanners()

    res.json({
      success: true,
      data: banners,
    })
  })

  // Admin routes
  createBanner = asyncHandler(async (req, res) => {
    const input = createBannerSchema.parse(req.body)

    const banner = await bannerService.createBanner(input)

    res.status(201).json({
      success: true,
      data: banner,
    })
  })

  updateBanner = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = updateBannerSchema.parse(req.body)

    const banner = await bannerService.updateBanner(id, input)

    res.json({
      success: true,
      data: banner,
    })
  })

  deleteBanner = asyncHandler(async (req, res) => {
    const { id } = req.params

    await bannerService.deleteBanner(id)

    res.json({
      success: true,
      data: { message: 'Banner deleted successfully' },
    })
  })

  getAllBanners = asyncHandler(async (req, res) => {
    const banners = await bannerService.getAllBanners()

    res.json({
      success: true,
      data: banners,
    })
  })
}

export const bannerController = new BannerController()