import prisma from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/error-handler.js'
import type {
  CreateHomepageSectionInput,
  UpdateHomepageSectionInput,
  AddProductToSectionInput,
  ReorderProductsInput,
} from './homepage-section.dto.js'

export class HomepageSectionService {
  // List all sections with pagination
  async getSections(params: {
    page?: number
    limit?: number
    sectionType?: string
    isActive?: boolean
  }) {
    const { page = 1, limit = 20, sectionType, isActive } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (sectionType) where.sectionType = sectionType
    if (isActive !== undefined) where.isActive = isActive

    const [sections, total] = await Promise.all([
      prisma.homepageSection.findMany({
        where,
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  slug: true,
                  price: true,
                  compareAtPrice: true,
                  status: true,
                  images: {
                    take: 1,
                    orderBy: { position: 'asc' },
                  },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.homepageSection.count({ where }),
    ])

    return {
      data: sections,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Get single section by ID
  async getSectionById(id: string) {
    const section = await prisma.homepageSection.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                price: true,
                compareAtPrice: true,
                status: true,
                images: {
                  take: 1,
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!section) {
      throw new NotFoundError('HomepageSection')
    }

    return section
  }

  // Create new section
  async createSection(data: CreateHomepageSectionInput) {
    return prisma.homepageSection.create({
      data: {
        sectionType: data.sectionType,
        title: data.title,
        titleEn: data.titleEn || null,
        subtitle: data.subtitle || null,
        subtitleEn: data.subtitleEn || null,
        slug: data.slug,
        description: data.description || null,
        descriptionEn: data.descriptionEn || null,
        imageUrl: data.imageUrl || null,
        mobileImageUrl: data.mobileImageUrl || null,
        ctaLabel: data.ctaLabel || null,
        ctaLabelEn: data.ctaLabelEn || null,
        ctaUrl: data.ctaUrl || null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    })
  }

  // Update section
  async updateSection(id: string, data: UpdateHomepageSectionInput) {
    // Check exists
    await this.getSectionById(id)

    return prisma.homepageSection.update({
      where: { id },
      data: {
        ...(data.sectionType && { sectionType: data.sectionType }),
        ...(data.title && { title: data.title }),
        ...(data.titleEn !== undefined && { titleEn: data.titleEn || null }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.subtitleEn !== undefined && { subtitleEn: data.subtitleEn }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.mobileImageUrl !== undefined && { mobileImageUrl: data.mobileImageUrl || null }),
        ...(data.ctaLabel !== undefined && { ctaLabel: data.ctaLabel }),
        ...(data.ctaLabelEn !== undefined && { ctaLabelEn: data.ctaLabelEn }),
        ...(data.ctaUrl !== undefined && { ctaUrl: data.ctaUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
        ...(data.endsAt !== undefined && { endsAt: data.endsAt ? new Date(data.endsAt) : null }),
      },
    })
  }

  // Soft delete section
  async deleteSection(id: string) {
    await this.getSectionById(id)

    return prisma.homepageSection.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  // Add product to section
  async addProduct(sectionId: string, data: AddProductToSectionInput) {
    // Verify section exists
    await this.getSectionById(sectionId)

    // Check if product exists in database
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    })

    if (!product) {
      throw new NotFoundError('Product')
    }

    // Check if product already in section
    const existing = await prisma.homepageSectionProduct.findUnique({
      where: {
        homepageSectionId_productId: {
          homepageSectionId: sectionId,
          productId: data.productId,
        },
      },
    })

    if (existing) {
      // Update sort order if already exists
      return prisma.homepageSectionProduct.update({
        where: { id: existing.id },
        data: { sortOrder: data.sortOrder ?? existing.sortOrder },
      })
    }

    // Get max sort order
    const maxOrder = await prisma.homepageSectionProduct.aggregate({
      where: { homepageSectionId: sectionId },
      _max: { sortOrder: true },
    })

    return prisma.homepageSectionProduct.create({
      data: {
        homepageSectionId: sectionId,
        productId: data.productId,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
  }

  // Reorder products in section
  async reorderProducts(sectionId: string, data: ReorderProductsInput) {
    await this.getSectionById(sectionId)

    // Update all products in one transaction
    await prisma.$transaction(
      data.products.map((p) =>
        prisma.homepageSectionProduct.update({
          where: {
            homepageSectionId_productId: {
              homepageSectionId: sectionId,
              productId: p.productId,
            },
          },
          data: { sortOrder: p.sortOrder },
        })
      )
    )

    return this.getSectionById(sectionId)
  }

  // Remove product from section
  async removeProduct(sectionId: string, productId: string) {
    await this.getSectionById(sectionId)

    return prisma.homepageSectionProduct.delete({
      where: {
        homepageSectionId_productId: {
          homepageSectionId: sectionId,
          productId,
        },
      },
    })
  }

  // Get active sections for storefront
  async getActiveSections() {
    const now = new Date()
    return prisma.homepageSection.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                price: true,
                compareAtPrice: true,
                status: true,
                images: {
                  take: 1,
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }
}

export const homepageSectionService = new HomepageSectionService()
