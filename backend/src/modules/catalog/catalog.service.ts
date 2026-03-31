import prisma from '../../config/database.js'
import { NotFoundError } from '../../shared/utils/error-handler.js'
import type { CreateCatalogDto, UpdateCatalogDto } from './catalog.dto.js'

export class CatalogService {
  async findAll() {
    return prisma.catalog.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findById(id: string) {
    const catalog = await prisma.catalog.findUnique({
      where: { id },
    })
    if (!catalog) {
      throw new NotFoundError('Catalog')
    }
    return catalog
  }

  async create(data: CreateCatalogDto) {
    return prisma.catalog.create({
      data: {
        name: data.name,
        nameEn: data.nameEn,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    })
  }

  async update(id: string, data: UpdateCatalogDto) {
    await this.findById(id)

    return prisma.catalog.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    })
  }

  async delete(id: string) {
    await this.findById(id)
    return prisma.catalog.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

export const catalogService = new CatalogService()