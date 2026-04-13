import prisma from '../../config/database.js'
import { NotFoundError, BadRequestError } from '../../shared/utils/error-handler.js'
import type {
  CreateHomepageSectionInput,
  UpdateHomepageSectionInput,
  ReorderSectionsInput,
  CreateHomepageItemInput,
  UpdateHomepageItemInput,
  ReorderItemsInput,
  AddProductToSectionInput,
  ReorderSectionProductsInput,
} from './homepage.dto.js'

export class HomepageService {
  // ==================== SECTIONS ====================

  async getSections(params: {
    page?: number
    limit?: number
    sectionType?: string
    isActive?: boolean
    search?: string
  }) {
    const { page = 1, limit = 20, sectionType, isActive, search } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (sectionType) where.sectionType = sectionType
    if (isActive !== undefined) where.isActive = isActive
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [sections, total] = await Promise.all([
      prisma.homepageSection.findMany({
        where,
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: { products: true },
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

  async getSectionById(id: string) {
    const section = await prisma.homepageSection.findUnique({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
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
                  orderBy: { sortOrder: 'asc' },
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

  async createSection(data: CreateHomepageSectionInput) {
    // Check slug unique
    const existing = await prisma.homepageSection.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      throw new BadRequestError('Slug already exists')
    }

    return prisma.homepageSection.create({
      data: {
        sectionType: data.sectionType,
        slug: data.slug,
        title: data.title || null,
        subtitle: data.subtitle || null,
        description: data.description || null,
        layout: data.layout || null,
        configJson: data.configJson || null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
      },
    })
  }

  async updateSection(id: string, data: UpdateHomepageSectionInput) {
    await this.getSectionById(id)

    // Check slug unique if changed
    if (data.slug) {
      const existing = await prisma.homepageSection.findFirst({
        where: { slug: data.slug, NOT: { id } },
      })
      if (existing) {
        throw new BadRequestError('Slug already exists')
      }
    }

    return prisma.homepageSection.update({
      where: { id },
      data: {
        ...(data.sectionType && { sectionType: data.sectionType }),
        ...(data.slug && { slug: data.slug }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.layout !== undefined && { layout: data.layout }),
        ...(data.configJson !== undefined && { configJson: data.configJson }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
        ...(data.endsAt !== undefined && { endsAt: data.endsAt ? new Date(data.endsAt) : null }),
      },
    })
  }

  async deleteSection(id: string) {
    await this.getSectionById(id)

    return prisma.homepageSection.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async reorderSections(data: ReorderSectionsInput) {
    await prisma.$transaction(
      data.sections.map((s) =>
        prisma.homepageSection.update({
          where: { id: s.id },
          data: { sortOrder: s.sortOrder },
        })
      )
    )

    return this.getSections({})
  }

  // ==================== ITEMS ====================

  async getItems(sectionId: string) {
    const section = await this.getSectionById(sectionId)

    return section.items
  }

  async createItem(sectionId: string, data: CreateHomepageItemInput) {
    await this.getSectionById(sectionId)

    // Get max sort order
    const maxOrder = await prisma.homepageSectionItem.aggregate({
      where: { homepageSectionId: sectionId, deletedAt: null },
      _max: { sortOrder: true },
    })

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
        metaJson: data.metaJson || null,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
  }

  async updateItem(sectionId: string, itemId: string, data: UpdateHomepageItemInput) {
    // Verify section and item exist
    await this.getSectionById(sectionId)

    const item = await prisma.homepageSectionItem.findFirst({
      where: { id: itemId, homepageSectionId: sectionId },
    })

    if (!item) {
      throw new NotFoundError('HomepageSectionItem')
    }

    return prisma.homepageSectionItem.update({
      where: { id: itemId },
      data: {
        ...(data.itemType && { itemType: data.itemType }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.mediaUrl !== undefined && { mediaUrl: data.mediaUrl || null }),
        ...(data.mobileMediaUrl !== undefined && { mobileMediaUrl: data.mobileMediaUrl || null }),
        ...(data.mediaType && { mediaType: data.mediaType }),
        ...(data.ctaLabel !== undefined && { ctaLabel: data.ctaLabel }),
        ...(data.ctaUrl !== undefined && { ctaUrl: data.ctaUrl || null }),
        ...(data.linkTarget && { linkTarget: data.linkTarget }),
        ...(data.metaJson !== undefined && { metaJson: data.metaJson }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    })
  }

  async deleteItem(sectionId: string, itemId: string) {
    await this.getSectionById(sectionId)

    const item = await prisma.homepageSectionItem.findFirst({
      where: { id: itemId, homepageSectionId: sectionId },
    })

    if (!item) {
      throw new NotFoundError('HomepageSectionItem')
    }

    return prisma.homepageSectionItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    })
  }

  async reorderItems(sectionId: string, data: ReorderItemsInput) {
    await this.getSectionById(sectionId)

    await prisma.$transaction(
      data.items.map((item) =>
        prisma.homepageSectionItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    )

    return this.getItems(sectionId)
  }

  // ==================== PRODUCTS ====================

  async addProduct(sectionId: string, data: AddProductToSectionInput) {
    await this.getSectionById(sectionId)

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    })

    if (!product) {
      throw new NotFoundError('Product')
    }

    // Check if already exists
    const existing = await prisma.homepageSectionProduct.findUnique({
      where: {
        homepageSectionId_productId: {
          homepageSectionId: sectionId,
          productId: data.productId,
        },
      },
    })

    if (existing) {
      return prisma.homepageSectionProduct.update({
        where: { id: existing.id },
        data: {
          badgeText: data.badgeText || null,
          sortOrder: data.sortOrder ?? existing.sortOrder,
        },
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
        badgeText: data.badgeText || null,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
  }

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

  async reorderProducts(sectionId: string, data: ReorderSectionProductsInput) {
    await this.getSectionById(sectionId)

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

  // ==================== STOREFRONT ====================

  /**
   * Simplified response for storefront homepage
   * Returns only essential fields: images, layout, and basic product info
   */
  async getActiveHomepage() {
    const now = new Date()

    const sections = await prisma.homepageSection.findMany({
      where: {
        pageKey: 'homepage',
        isActive: true,
        deletedAt: null,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: {
        items: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            collection: true,
          },
        },
        products: {
          orderBy: { sortOrder: 'asc' },
          select: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return sections.map((section) => ({
      id: section.id,
      sectionType: section.sectionType,
      layout: section.layout,
      title: section.title,
      subtitle: section.subtitle,
      items: section.items.map((item) => {
        // COLLECTION type: use collection directly, avoid duplicate fields
        if (item.itemType === 'COLLECTION' && item.collection) {
          return {
            id: item.id,
            type: item.itemType,
            collection: {
              id: item.collection.id,
              name: item.collection.name,
              nameEn: item.collection.nameEn,
              slug: item.collection.slug,
              description: item.collection.description,
              image: item.collection.image,
              isActive: item.collection.isActive,
            },
          }
        }

        // Other types (BANNER, MEDIA_TILE, PRODUCT): include all fields
        return {
          id: item.id,
          type: item.itemType,
          title: item.title,
          subtitle: item.subtitle,
          image: item.mediaUrl,
          mobileImage: item.mobileMediaUrl,
          mediaType: item.mediaType,
          cta: item.ctaLabel,
          ctaUrl: item.ctaUrl,
        }
      }),
      products: section.products.map((sp) => ({
        id: sp.product.id,
        name: sp.product.name,
        slug: sp.product.slug,
        price: sp.product.price,
        image: sp.product.image || null,
      })),
    }))
  }

  async getSectionBySlug(slug: string) {
    const section = await prisma.homepageSection.findUnique({
      where: { slug },
      include: {
        items: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            collection: true,
          },
        },
        products: {
          orderBy: { sortOrder: 'asc' },
          select: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!section || section.deletedAt) {
      throw new NotFoundError('HomepageSection')
    }

    return {
      id: section.id,
      sectionType: section.sectionType,
      layout: section.layout,
      title: section.title,
      subtitle: section.subtitle,
      items: section.items.map((item) => {
        // COLLECTION type: use collection directly, avoid duplicate fields
        if (item.itemType === 'COLLECTION' && item.collection) {
          return {
            id: item.id,
            type: item.itemType,
            collection: {
              id: item.collection.id,
              name: item.collection.name,
              nameEn: item.collection.nameEn,
              slug: item.collection.slug,
              description: item.collection.description,
              image: item.collection.image,
              isActive: item.collection.isActive,
            },
          }
        }

        // Other types (BANNER, MEDIA_TILE, PRODUCT): include all fields
        return {
          id: item.id,
          type: item.itemType,
          title: item.title,
          subtitle: item.subtitle,
          image: item.mediaUrl,
          mobileImage: item.mobileMediaUrl,
          mediaType: item.mediaType,
          cta: item.ctaLabel,
          ctaUrl: item.ctaUrl,
        }
      }),
      products: section.products.map((sp) => ({
        id: sp.product.id,
        name: sp.product.name,
        slug: sp.product.slug,
        price: sp.product.price,
        image: sp.product.image || null,
      })),
    }
  }
}

export const homepageService = new HomepageService()
