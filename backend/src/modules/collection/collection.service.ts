import { PrismaClient } from '@prisma/client'
import { CreateCollectionDtoType, UpdateCollectionDtoType } from './collection.dto.js'
import { transformProductImages, transformCollection } from '../../shared/utils/file.js'

const prisma = new PrismaClient()

export class CollectionService {
  async findAll() {
    const collections = await prisma.collection.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return collections.map((c) => transformCollection(c))
  }

  async findById(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
    })
    return collection ? transformCollection(collection) : null
  }

  async create(data: CreateCollectionDtoType) {
    const collection = await prisma.collection.create({ data })
    return transformCollection(collection)
  }

  async update(id: string, data: UpdateCollectionDtoType) {
    const collection = await prisma.collection.update({ where: { id }, data })
    return transformCollection(collection)
  }

  async delete(id: string) {
    return prisma.collection.delete({ where: { id } })
  }

  async addProducts(collectionId: string, productIds: string[]) {
    const data = productIds.map((productId, index) => ({
      collectionId,
      productId,
      sortOrder: index,
    }))
    return prisma.collectionProduct.createMany({ data, skipDuplicates: true })
  }

  async removeProducts(collectionId: string, productIds: string[]) {
    return prisma.collectionProduct.deleteMany({
      where: {
        collectionId,
        productId: { in: productIds },
      },
    })
  }

  async getProducts(collectionId: string) {
    const items = await prisma.collectionProduct.findMany({
      where: { collectionId },
      include: { product: { include: { images: true, variants: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    const products = items.map((item) => ({
      ...item.product,
      images: transformProductImages(item.product.images),
    }))
    return products
  }
}

export const collectionService = new CollectionService()
