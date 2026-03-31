import { PrismaClient } from '@prisma/client'
import { CreateCollectionDtoType, UpdateCollectionDtoType } from './collection.dto.js'

const prisma = new PrismaClient()

export class CollectionService {
  async findAll() {
    return prisma.collection.findMany({
      include: { catalog: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.collection.findUnique({
      where: { id },
      include: { catalog: true },
    })
  }

  async findByCatalog(catalogId: string) {
    return prisma.collection.findMany({
      where: { catalogId },
      include: { catalog: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async create(data: CreateCollectionDtoType) {
    return prisma.collection.create({ data })
  }

  async update(id: string, data: UpdateCollectionDtoType) {
    return prisma.collection.update({ where: { id }, data })
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
    return prisma.collectionProduct.createMany({ data })
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
    return items.map((item) => item.product)
  }
}

export const collectionService = new CollectionService()
