import { Prisma } from '@prisma/client'
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
        configJson: (data.configJson as Prisma.InputJsonValue) ?? Prisma.JsonNull,
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
        ...(data.configJson !== undefined && { configJson: data.configJson as Prisma.InputJsonValue }),
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
        metaJson: (data.metaJson as Prisma.InputJsonValue) ?? Prisma.JsonNull,
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
        ...(data.metaJson !== undefined && { metaJson: data.metaJson as Prisma.InputJsonValue }),
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

    const enrichedSections = await enrichCategoryShowcaseSections(sections)
    return enrichedSections.map((section) => mapSectionToStorefront(section))
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

    const [enriched] = await enrichCategoryShowcaseSections([section])
    return mapSectionToStorefront(enriched)
  }
}

// ==================== CATEGORY_SHOWCASE ENRICHMENT ====================

// Type alias for the metaJson shape used in CATEGORY_SHOWCASE items.
type CategoryItemMeta = { categoryId?: string; titleEn?: string; ctaLabelEn?: string } | null

// Shape of the enriched category data attached to each item.
interface CategoryData {
  id: string
  name: string
  nameEn: string | null
  slug: string
}

/**
 * Batch-enriches CATEGORY_SHOWCASE items with:
 *  - _previewImage: auto-fetched from first active product in their category
 *    (skipped when admin-supplied mediaUrl is present).
 *  - _category: { id, name, nameEn, slug } of the linked category.
 *
 * Both fields are consumed by mapSectionToStorefront and exposed to the frontend.
 * Operates on any array of sections that share the Prisma findMany shape above —
 * used by both getActiveHomepage() and getSectionBySlug().
 */
async function enrichCategoryShowcaseSections<
  TSection extends {
    sectionType: string
    items: Array<{
      mediaUrl: string | null
      metaJson: unknown
      [key: string]: unknown
    }>
    [key: string]: unknown
  },
>(sections: TSection[]): Promise<(TSection & { items: (TSection['items'][number] & { _previewImage?: string | null; _category?: CategoryData | null })[] })[]> {
  // Collect unique categoryIds across all CATEGORY_SHOWCASE sections
  const allCategoryIds = new Set<string>()

  for (const section of sections) {
    if (section.sectionType !== 'CATEGORY_SHOWCASE') continue
    for (const item of section.items) {
      const meta = item.metaJson as CategoryItemMeta
      const categoryId = meta?.categoryId
      if (categoryId) allCategoryIds.add(categoryId)
    }
  }

  if (allCategoryIds.size === 0) {
    // Nothing to enrich — return sections unchanged with typed cast
    return sections as (TSection & { items: (TSection['items'][number] & { _previewImage?: string | null; _category?: CategoryData | null })[] })[]
  }

  // Batch fetch 1: category metadata (id, name, nameEn, slug)
  const categoryDataMap = new Map<string, CategoryData>()
  const categoriesFromDb = await prisma.category.findMany({
    where: { id: { in: [...allCategoryIds] } },
    select: { id: true, name: true, nameEn: true, slug: true },
  })
  for (const cat of categoriesFromDb) {
    categoryDataMap.set(cat.id, { id: cat.id, name: cat.name, nameEn: cat.nameEn, slug: cat.slug })
  }

  // Batch fetch 2: product preview images for items that have no admin mediaUrl override
  const categoryIdsNeedingImage = new Set<string>()
  for (const section of sections) {
    if (section.sectionType !== 'CATEGORY_SHOWCASE') continue
    for (const item of section.items) {
      if (item.mediaUrl) continue // Admin override — skip image lookup
      const meta = item.metaJson as CategoryItemMeta
      const categoryId = meta?.categoryId
      if (categoryId) categoryIdsNeedingImage.add(categoryId)
    }
  }

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

    // Keep the newest product image per categoryId (sorted by createdAt desc above)
    for (const p of products) {
      if (!p.categoryId) continue
      if (categoryImageMap.has(p.categoryId)) continue // Already have one for this category

      const img = p.images[0]
      // product.image may be stored as a JSON array string (legacy) — parse and
      // extract the first element when that is the case.
      const rawImage = p.image ?? null
      const parsedImage = (() => {
        if (!rawImage) return null
        if (rawImage.startsWith('[')) {
          try {
            const arr = JSON.parse(rawImage) as unknown[]
            return typeof arr[0] === 'string' ? arr[0] : null
          } catch {
            return rawImage
          }
        }
        return rawImage
      })()
      const imageUrl = img?.publicUrl ?? img?.url ?? parsedImage
      if (imageUrl) {
        categoryImageMap.set(p.categoryId, imageUrl)
      }
    }
  }

  // Attach _previewImage and _category to each CATEGORY_SHOWCASE item
  return sections.map((section) => {
    if (section.sectionType !== 'CATEGORY_SHOWCASE') {
      return section as TSection & { items: (TSection['items'][number] & { _previewImage?: string | null; _category?: CategoryData | null })[] }
    }

    const enrichedItems = section.items.map((item) => {
      const meta = item.metaJson as CategoryItemMeta
      const categoryId = meta?.categoryId

      const _category = categoryId ? (categoryDataMap.get(categoryId) ?? null) : null

      // Admin override takes priority for image
      if (item.mediaUrl) return { ...item, _previewImage: item.mediaUrl, _category }

      const _previewImage = categoryId ? (categoryImageMap.get(categoryId) ?? null) : null
      return { ...item, _previewImage, _category }
    })

    return { ...section, items: enrichedItems }
  })
}

// ==================== STOREFRONT MAPPER ====================

/**
 * Storefront mapper: shapes section + items + products into the response
 * consumed by the frontend. Single source of truth for both list and detail
 * endpoints — keep them in sync.
 *
 * CATEGORY_SHOWCASE sections use a richer item shape that the frontend
 * category-showcase-section component expects.
 */
function mapSectionToStorefront(section: any) {
  // CATEGORY_SHOWCASE: richer item shape for category tiles.
  // Exposes `category` (not `collection`) — each tile links to /products?category=<slug>.
  if (section.sectionType === 'CATEGORY_SHOWCASE') {
    return {
      id: section.id,
      sectionType: section.sectionType,
      layout: section.layout,
      title: section.title,
      subtitle: section.subtitle,
      items: section.items.map((item: any) => ({
        id: item.id,
        type: item.itemType,
        title: item.title,             // eyebrow VI
        subtitle: item.subtitle,       // eyebrow EN
        description: item.description, // title override VI
        mediaUrl: item.mediaUrl,       // admin override image
        previewImage: item._previewImage ?? null, // auto-fetched fallback from category product
        ctaLabel: item.ctaLabel,
        ctaUrl: item.ctaUrl,
        isActive: item.isActive,
        metaJson: item.metaJson,       // { titleEn, ctaLabelEn, categoryId }
        // category links to /products?category=<slug> — NOT /collections/<slug>
        category: item._category
          ? {
              id: item._category.id,
              name: item._category.name,
              nameEn: item._category.nameEn,
              slug: item._category.slug,
            }
          : null,
      })),
      products: [],
    }
  }

  // All other section types: existing generic shape
  return {
    id: section.id,
    sectionType: section.sectionType,
    layout: section.layout,
    title: section.title,
    subtitle: section.subtitle,
    items: section.items.map((item: any) => {
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

      // BANNER, MEDIA_TILE, PRODUCT, ANNOUNCEMENT
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
    products: section.products.map((sp: any) => ({
      id: sp.product.id,
      name: sp.product.name,
      slug: sp.product.slug,
      price: sp.product.price,
      image: sp.product.image || null,
    })),
  }
}

export const homepageService = new HomepageService()
