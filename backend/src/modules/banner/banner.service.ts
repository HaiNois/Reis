import prisma from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/error-handler.js'
import type { CreateBannerInput, UpdateBannerInput } from './banner.dto.js'

export class BannerService {
  async getBanners() {
    const now = new Date()

    return prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { position: 'asc' },
    })
  }

  async createBanner(input: CreateBannerInput) {
    return prisma.banner.create({ data: input })
  }

  async updateBanner(id: string, input: UpdateBannerInput) {
    const banner = await prisma.banner.findUnique({ where: { id } })

    if (!banner) {
      throw new NotFoundError('Banner')
    }

    return prisma.banner.update({
      where: { id },
      data: input,
    })
  }

  async deleteBanner(id: string) {
    const banner = await prisma.banner.findUnique({ where: { id } })

    if (!banner) {
      throw new NotFoundError('Banner')
    }

    await prisma.banner.delete({ where: { id } })
  }

  async getAllBanners() {
    return prisma.banner.findMany({
      orderBy: { position: 'asc' },
    })
  }
}

export const bannerService = new BannerService()