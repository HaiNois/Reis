import prisma from '../../config/database.js'
import { NotFoundError, ValidationError } from '../../shared/utils/error-handler.js'
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
  UpdateVariantStockInput,
  CreateCategoryInput,
  ProductFilters,
  AddProductImageInput
} from './product.dto.js'

export class ProductService {
  async getProducts(filters: ProductFilters) {
    const { category, minPrice, maxPrice, status, isFeatured, isNewArrival, search, sort, page, limit } = filters

    const where: any = {
      isDelete: false,
    }

    if (category) {
      where.category = { slug: category }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = minPrice
      if (maxPrice) where.price.lte = maxPrice
    }

    if (status) {
      where.status = status
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured
    }

    if (isNewArrival !== undefined) {
      where.isNewArrival = isNewArrival
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Sort mapping
    const orderBy: any = {}
    switch (sort) {
      case 'price-asc':
        orderBy.price = 'asc'
        break
      case 'price-desc':
        orderBy.price = 'desc'
        break
      case 'popular':
        orderBy.orderItems = { _count: 'desc' }
        break
      default:
        orderBy.createdAt = 'desc'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { position: 'asc' } },
          variants: { where: { isActive: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    })

    if (!product) {
      throw new NotFoundError('Product')
    }

    return product
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    })

    if (!product) {
      throw new NotFoundError('Product')
    }

    return product
  }

  async createProduct(input: CreateProductInput & { variants?: CreateVariantInput[] }) {
    // Check slug uniqueness
    const existing = await prisma.product.findUnique({
      where: { slug: input.slug },
    })

    if (existing) {
      throw new ValidationError('Slug already exists')
    }

    const { variants, ...productData } = input

    const product = await prisma.product.create({
      data: {
        ...productData,
        variants: variants ? { create: variants } : undefined,
      },
      include: {
        variants: true,
        images: true,
      },
    })

    return product
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const product = await prisma.product.findUnique({ where: { id } })

    if (!product) {
      throw new NotFoundError('Product')
    }

    // Check slug uniqueness if updating
    if (input.slug && input.slug !== product.slug) {
      const existing = await prisma.product.findUnique({
        where: { slug: input.slug },
      })
      if (existing) {
        throw new ValidationError('Slug already exists')
      }
    }

    return prisma.product.update({
      where: { id },
      data: input,
      include: {
        variants: true,
        images: true,
      },
    })
  }

  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } })

    if (!product) {
      throw new NotFoundError('Product')
    }

    // Soft delete
    return prisma.product.update({
      where: { id },
      data: { isDelete: true },
    })
  }

  async restoreProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } })

    if (!product) {
      throw new NotFoundError('Product')
    }

    return prisma.product.update({
      where: { id },
      data: { isDelete: false },
    })
  }

  // Variants
  async createVariant(productId: string, input: CreateVariantInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } })

    if (!product) {
      throw new NotFoundError('Product')
    }

    // Check SKU uniqueness
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: input.sku },
    })

    if (existingSku) {
      throw new ValidationError('SKU already exists')
    }

    return prisma.productVariant.create({
      data: {
        ...input,
        productId,
      },
    })
  }

  async updateVariant(variantId: string, input: UpdateVariantInput) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })

    if (!variant) {
      throw new NotFoundError('Variant')
    }

    // Check SKU uniqueness if updating
    if (input.sku && input.sku !== variant.sku) {
      const existing = await prisma.productVariant.findUnique({
        where: { sku: input.sku },
      })
      if (existing) {
        throw new ValidationError('SKU already exists')
      }
    }

    return prisma.productVariant.update({
      where: { id: variantId },
      data: input,
    })
  }

  async updateVariantStock(variantId: string, input: UpdateVariantStockInput, userId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })

    if (!variant) {
      throw new NotFoundError('Variant')
    }

    // Update stock in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update variant quantity
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { quantity: input.quantity },
      })

      // Create inventory log
      await tx.inventoryLog.create({
        data: {
          variantId,
          quantity: input.quantity - variant.quantity,
          type: 'ADJUSTMENT',
          note: input.note || 'Manual adjustment',
          createdBy: userId,
        },
      })

      return updated
    })

    return result
  }

  async deleteVariant(variantId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })

    if (!variant) {
      throw new NotFoundError('Variant')
    }

    await prisma.productVariant.delete({ where: { id: variantId } })
  }

  // Images
  async addImage(productId: string, input: AddProductImageInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } })

    if (!product) {
      throw new NotFoundError('Product')
    }

    return prisma.productImage.create({
      data: {
        ...input,
        productId,
      },
    })
  }

  async deleteImage(imageId: string) {
    const image = await prisma.productImage.findUnique({ where: { id: imageId } })

    if (!image) {
      throw new NotFoundError('Image')
    }

    await prisma.productImage.delete({ where: { id: imageId } })
  }

  // Categories
  async getCategories() {
    try {
      return await prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: true,
        },
      })
    } catch (error) {
      console.error('getCategories error:', error)
      throw error
    }
  }

  async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        children: true,
      },
    })

    if (!category) {
      throw new NotFoundError('Category')
    }

    return category
  }

  async createCategory(input: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({
      where: { slug: input.slug },
    })

    if (existing) {
      throw new ValidationError('Slug already exists')
    }

    return prisma.category.create({ data: input })
  }

  async updateCategory(id: string, input: Partial<CreateCategoryInput>) {
    const category = await prisma.category.findUnique({ where: { id } })

    if (!category) {
      throw new NotFoundError('Category')
    }

    return prisma.category.update({
      where: { id },
      data: input,
    })
  }

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id } })

    if (!category) {
      throw new NotFoundError('Category')
    }

    await prisma.category.delete({ where: { id } })
  }

  // Related products
  async getRelatedProducts(productId: string, limit: number = 4) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    })

    if (!product || !product.categoryId) {
      return []
    }

    return prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        status: 'ACTIVE',
      },
      take: limit,
      include: {
        images: { take: 1, orderBy: { position: 'asc' } },
        variants: true,
      },
    })
  }
}

export const productService = new ProductService()
