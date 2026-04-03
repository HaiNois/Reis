import prisma from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/error-handler.js'
import type {
  CreateHomepageSectionInput,
  UpdateHomepageSectionInput,
  AddProductToSectionInput,
  ReorderProductsInput,
  CreateHomepageSectionItemInput,
  UpdateHomepageSectionItemInput,
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

    const where: any = { deletedAt: null } // Only get non-deleted sections
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
    // Generate unique slug if exists
    let slug = data.slug
    let counter = 1
    while (await prisma.homepageSection.findUnique({ where: { slug } })) {
      slug = `${data.slug}-${counter}`
      counter++
    }

    return prisma.homepageSection.create({
      data: {
        sectionType: data.sectionType,
        title: data.title,
        slug,
        subtitle: data.subtitle || null,
        description: data.description || null,
        layout: data.layout || null,
        configJson: data.configJson as any || null,
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
        ...(data.title !== undefined && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.layout !== undefined && { layout: data.layout }),
        ...(data.configJson !== undefined && { configJson: data.configJson as any }),
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

  // ==================== SECTION ITEMS ====================

  // Get items for a section
  async getItems(sectionId: string) {
    await this.getSectionById(sectionId)

    return prisma.homepageSectionItem.findMany({
      where: {
        homepageSectionId: sectionId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  // Get single item
  async getItemById(itemId: string) {
    const item = await prisma.homepageSectionItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new NotFoundError('HomepageSectionItem')
    }

    return item
  }

  // Create item
  async createItem(sectionId: string, data: CreateHomepageSectionItemInput) {
    await this.getSectionById(sectionId)

    // Get max sort order
    const maxOrder = await prisma.homepageSectionItem.aggregate({
      where: { homepageSectionId: sectionId },
      _max: { sortOrder: true },
    })

    // Build metaJson with productId or collectionId if provided
    const metaJson = data.metaJson || {}
    if (data.itemType === 'PRODUCT' && (data.metaJson as any)?.productId) {
      metaJson.productId = (data.metaJson as any).productId
    }
    if (data.itemType === 'COLLECTION' && (data.metaJson as any)?.collectionId) {
      metaJson.collectionId = (data.metaJson as any).collectionId
    }

    return prisma.homepageSectionItem.create({
      data: {
        homepageSectionId: sectionId,
        itemType: data.itemType,
        title: data.title || null,
        subtitle: data.subtitle || null,
        description: data.description || null,
        mediaUrl: data.mediaUrl || null,
        mobileMediaUrl: data.mobileMediaUrl || null,
        mediaType: data.mediaType || 'IMAGE',
        ctaLabel: data.ctaLabel || null,
        ctaUrl: data.ctaUrl || null,
        linkTarget: data.linkTarget || 'SELF',
        metaJson: Object.keys(metaJson).length > 0 ? metaJson : null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
  }

  // Update item
  async updateItem(itemId: string, data: UpdateHomepageSectionItemInput) {
    const existing = await this.getItemById(itemId)

    // Merge metaJson - preserve productId/collectionId if not being updated
    const metaJson = data.metaJson || {}
    if (data.itemType === 'PRODUCT' && !metaJson.productId && existing.metaJson) {
      const existingMeta = typeof existing.metaJson === 'string'
        ? JSON.parse(existing.metaJson)
        : existing.metaJson
      if (existingMeta.productId) metaJson.productId = existingMeta.productId
    }
    if (data.itemType === 'COLLECTION' && !metaJson.collectionId && existing.metaJson) {
      const existingMeta = typeof existing.metaJson === 'string'
        ? JSON.parse(existing.metaJson)
        : existing.metaJson
      if (existingMeta.collectionId) metaJson.collectionId = existingMeta.collectionId
    }

    return prisma.homepageSectionItem.update({
      where: { id: itemId },
      data: {
        ...(data.itemType && { itemType: data.itemType }),
        ...(data.title !== undefined && { title: data.title || null }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.mediaUrl !== undefined && { mediaUrl: data.mediaUrl || null }),
        ...(data.mobileMediaUrl !== undefined && { mobileMediaUrl: data.mobileMediaUrl || null }),
        ...(data.mediaType && { mediaType: data.mediaType }),
        ...(data.ctaLabel !== undefined && { ctaLabel: data.ctaLabel || null }),
        ...(data.ctaUrl !== undefined && { ctaUrl: data.ctaUrl || null }),
        ...(data.linkTarget && { linkTarget: data.linkTarget }),
        ...(data.metaJson !== undefined || Object.keys(metaJson).length > 0
          ? { metaJson: Object.keys(metaJson).length > 0 ? metaJson : null }
          : {}),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    })
  }

  // Delete item (soft delete)
  async deleteItem(itemId: string) {
    const item = await this.getItemById(itemId)

    return prisma.homepageSectionItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    })
  }

  // Reorder items
  async reorderItems(sectionId: string, items: { id: string; sortOrder: number }[]) {
    await this.getSectionById(sectionId)

    await prisma.$transaction(
      items.map((item) =>
        prisma.homepageSectionItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    )

    return this.getItems(sectionId)
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
