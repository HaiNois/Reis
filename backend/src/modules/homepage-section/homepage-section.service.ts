import { Prisma } from '@prisma/client'
import prisma from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/error-handler.js'
import type {
  CreateHomepageSectionInput,
  UpdateHomepageSectionInput,
  AddProductToSectionInput,
  ReorderProductsInput,
  ReorderSectionsInput,
  CreateHomepageSectionItemInput,
  UpdateHomepageSectionItemInput,
  SyncItemsInput,
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
          items: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              collection: {
                select: { id: true, name: true, nameEn: true, slug: true, image: true },
              },
            },
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
                    take: 1,
                    orderBy: { position: 'asc' },
                  },
                },
              },
            },
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

  // Get single section by ID
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
  async reorderSections(data: ReorderSectionsInput) {
    await prisma.$transaction(
      data.sections.map((s) =>
        prisma.homepageSection.update({
          where: { id: s.id },
          data: { sortOrder: s.sortOrder },
        })
      )
    )

    return prisma.homepageSection.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    })
  }

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

    // For COLLECTION items, validate the collection exists
    if (data.itemType === 'COLLECTION' && data.collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: data.collectionId },
        select: { id: true },
      })
      if (!collection) {
        throw new NotFoundError('Collection')
      }
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
        collectionId: data.itemType === 'COLLECTION' ? data.collectionId ?? null : null,
        metaJson: data.metaJson && Object.keys(data.metaJson).length > 0
          ? (data.metaJson as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
  }

  // Update item
  async updateItem(itemId: string, data: UpdateHomepageSectionItemInput) {
    await this.getItemById(itemId)

    if (data.collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: data.collectionId },
        select: { id: true },
      })
      if (!collection) {
        throw new NotFoundError('Collection')
      }
    }

    const updateData: Prisma.HomepageSectionItemUncheckedUpdateInput = {
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
      ...(data.collectionId !== undefined && { collectionId: data.collectionId }),
      ...(data.metaJson !== undefined && {
        metaJson: data.metaJson && Object.keys(data.metaJson).length > 0
          ? (data.metaJson as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    }

    return prisma.homepageSectionItem.update({
      where: { id: itemId },
      data: updateData,
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

  // Replace-all sync items for a section.
  // - items with id present → update in place
  // - items without id → create new
  // - existing items not in payload → soft delete
  // sortOrder is set by index in the incoming array.
  async syncItems(sectionId: string, payload: SyncItemsInput) {
    await this.getSectionById(sectionId)

    const incoming = payload.items
    const incomingIds = incoming.filter((i) => i.id).map((i) => i.id as string)

    // Validate all collectionIds in one query
    const collectionIds = incoming
      .filter((i) => i.itemType === 'COLLECTION' && i.collectionId)
      .map((i) => i.collectionId as string)

    if (collectionIds.length > 0) {
      const found = await prisma.collection.findMany({
        where: { id: { in: collectionIds } },
        select: { id: true },
      })
      const foundIds = new Set(found.map((c) => c.id))
      const missing = collectionIds.find((id) => !foundIds.has(id))
      if (missing) {
        throw new NotFoundError(`Collection ${missing}`)
      }
    }

    // Existing items in this section
    const existing = await prisma.homepageSectionItem.findMany({
      where: { homepageSectionId: sectionId, deletedAt: null },
      select: { id: true },
    })
    const toDelete = existing.filter((e) => !incomingIds.includes(e.id)).map((e) => e.id)

    await prisma.$transaction([
      // Soft delete removed items
      ...(toDelete.length > 0
        ? [
            prisma.homepageSectionItem.updateMany({
              where: { id: { in: toDelete } },
              data: { deletedAt: new Date() },
            }),
          ]
        : []),
      // Update existing items
      ...incoming
        .filter((i) => i.id)
        .map((i) => {
          const updateData: Prisma.HomepageSectionItemUncheckedUpdateInput = {
            itemType: i.itemType,
            title: i.title || null,
            subtitle: i.subtitle || null,
            description: i.description || null,
            mediaUrl: i.mediaUrl || null,
            mobileMediaUrl: i.mobileMediaUrl || null,
            mediaType: i.mediaType ?? 'IMAGE',
            ctaLabel: i.ctaLabel || null,
            ctaUrl: i.ctaUrl || null,
            linkTarget: i.linkTarget ?? 'SELF',
            collectionId: i.itemType === 'COLLECTION' ? i.collectionId ?? null : null,
            metaJson: i.metaJson && Object.keys(i.metaJson).length > 0
              ? (i.metaJson as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            isActive: i.isActive ?? true,
            sortOrder: incoming.findIndex((x) => x === i),
          }
          return prisma.homepageSectionItem.update({
            where: { id: i.id! },
            data: updateData,
          })
        }),
      // Create new items
      ...incoming
        .filter((i) => !i.id)
        .map((i) =>
          prisma.homepageSectionItem.create({
            data: {
              homepageSectionId: sectionId,
              itemType: i.itemType,
              title: i.title || null,
              subtitle: i.subtitle || null,
              description: i.description || null,
              mediaUrl: i.mediaUrl || null,
              mobileMediaUrl: i.mobileMediaUrl || null,
              mediaType: i.mediaType ?? 'IMAGE',
              ctaLabel: i.ctaLabel || null,
              ctaUrl: i.ctaUrl || null,
              linkTarget: i.linkTarget ?? 'SELF',
              collectionId: i.itemType === 'COLLECTION' ? i.collectionId ?? null : null,
              metaJson: i.metaJson && Object.keys(i.metaJson).length > 0
                ? (i.metaJson as Prisma.InputJsonValue)
                : Prisma.JsonNull,
              isActive: i.isActive ?? true,
              sortOrder: incoming.findIndex((x) => x === i),
            },
          })
        ),
    ])

    return this.getItems(sectionId)
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
  // For CATEGORY_SHOWCASE sections, each item with metaJson.categoryId and no
  // mediaUrl override gets a previewImage auto-fetched from the first active
  // product belonging to that category. mediaUrl (admin override) takes priority.
  async getActiveSections() {
    const now = new Date()

    const sections = await prisma.homepageSection.findMany({
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
        items: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                image: true,
              },
            },
          },
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

    // --- CATEGORY_SHOWCASE enrichment ---
    // For each CATEGORY_SHOWCASE item we enrich two extra fields:
    //   previewImage — auto-fetched from first active product in the category
    //   _category    — { id, name, nameEn, slug } of the linked category

    // Collect all unique categoryIds across CATEGORY_SHOWCASE sections
    const allCategoryIds = new Set<string>()

    for (const section of sections) {
      if (section.sectionType !== 'CATEGORY_SHOWCASE') continue
      for (const item of section.items) {
        const meta = item.metaJson as { categoryId?: string } | null
        const categoryId = meta?.categoryId
        if (categoryId) allCategoryIds.add(categoryId)
      }
    }

    // Build category metadata map { id → { id, name, nameEn, slug } }
    const categoryDataMap = new Map<string, { id: string; name: string; nameEn: string | null; slug: string }>()

    if (allCategoryIds.size > 0) {
      const categoriesFromDb = await prisma.category.findMany({
        where: { id: { in: [...allCategoryIds] } },
        select: { id: true, name: true, nameEn: true, slug: true },
      })
      for (const cat of categoriesFromDb) {
        categoryDataMap.set(cat.id, { id: cat.id, name: cat.name, nameEn: cat.nameEn, slug: cat.slug })
      }
    }

    // Collect categoryIds that need a product image (only when no admin mediaUrl override)
    const categoryIdsNeedingImage = new Set<string>()
    for (const section of sections) {
      if (section.sectionType !== 'CATEGORY_SHOWCASE') continue
      for (const item of section.items) {
        if (item.mediaUrl) continue // Admin override — skip
        const meta = item.metaJson as { categoryId?: string } | null
        const categoryId = meta?.categoryId
        if (categoryId) categoryIdsNeedingImage.add(categoryId)
      }
    }

    // Single batch query: fetch the latest active product per category.
    // MySQL does not support DISTINCT ON, so we fetch all and reduce JS-side.
    // Dataset is small (number of categories in showcase tiles) — this is fine for MVP.
    const categoryImageMap = new Map<string, string>()

    if (categoryIdsNeedingImage.size > 0) {
      const products = await prisma.product.findMany({
        where: {
          categoryId: { in: [...categoryIdsNeedingImage] },
          status: 'ACTIVE',
          isDelete: false,
          deletedAt: null,
        },
        select: {
          id: true,
          categoryId: true,
          image: true,
          images: {
            take: 1,
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            select: { publicUrl: true, url: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Reduce: keep first product encountered per categoryId (already sorted by
      // createdAt desc, so the newest product wins).
      for (const p of products) {
        if (!p.categoryId) continue
        if (categoryImageMap.has(p.categoryId)) continue // Already have one for this category

        const img = p.images[0]
        const imageUrl = img?.publicUrl ?? img?.url ?? p.image ?? null
        if (imageUrl) {
          categoryImageMap.set(p.categoryId, imageUrl)
        }
      }
    }

    // Enrich sections: attach previewImage and _category to CATEGORY_SHOWCASE items.
    // Cast to unknown[] first to avoid fighting Prisma's inferred return type
    // when attaching the extra fields.
    return (sections as unknown[]).map((rawSection) => {
      const section = rawSection as typeof sections[number] & {
        items: (typeof sections[number]['items'][number] & {
          previewImage?: string | null
          _category?: { id: string; name: string; nameEn: string | null; slug: string } | null
        })[]
      }

      if (section.sectionType !== 'CATEGORY_SHOWCASE') return section

      const enrichedItems = section.items.map((item) => {
        const meta = item.metaJson as { categoryId?: string } | null
        const categoryId = meta?.categoryId

        const _category = categoryId ? (categoryDataMap.get(categoryId) ?? null) : null

        // Admin override wins for image
        if (item.mediaUrl) return { ...item, previewImage: item.mediaUrl, _category }

        const previewImage = categoryId ? (categoryImageMap.get(categoryId) ?? null) : null

        return { ...item, previewImage, _category }
      })

      return { ...section, items: enrichedItems }
    })
  }
}

export const homepageSectionService = new HomepageSectionService()
