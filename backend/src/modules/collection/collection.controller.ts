import { Request, Response } from 'express'
import { collectionService } from './collection.service.js'
import { CreateCollectionDto, UpdateCollectionDto } from './collection.dto.js'
import { ApiError } from '../../shared/utils/api-error.js'

export class CollectionController {
  async findAll(req: Request, res: Response) {
    const collections = await collectionService.findAll()
    res.json({ success: true, data: collections })
  }

  async findById(req: Request, res: Response) {
    const { id } = req.params
    const collection = await collectionService.findById(id)
    if (!collection) {
      throw new ApiError('Collection not found', 404)
    }
    res.json({ success: true, data: collection })
  }

  async findByCatalog(req: Request, res: Response) {
    const { catalogId } = req.params
    const collections = await collectionService.findByCatalog(catalogId)
    res.json({ success: true, data: collections })
  }

  async create(req: Request, res: Response) {
    const data = CreateCollectionDto.parse(req.body)
    const collection = await collectionService.create(data)
    res.status(201).json({ success: true, data: collection })
  }

  async update(req: Request, res: Response) {
    const { id } = req.params
    const data = UpdateCollectionDto.parse(req.body)
    const collection = await collectionService.update(id, data)
    res.json({ success: true, data: collection })
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params
    await collectionService.delete(id)
    res.json({ success: true })
  }

  async getProducts(req: Request, res: Response) {
    const { id } = req.params
    const products = await collectionService.getProducts(id)
    res.json({ success: true, data: products })
  }

  async addProducts(req: Request, res: Response) {
    const { id } = req.params
    const { productIds } = req.body
    await collectionService.addProducts(id, productIds)
    res.json({ success: true })
  }

  async removeProducts(req: Request, res: Response) {
    const { id } = req.params
    const { productIds } = req.body
    await collectionService.removeProducts(id, productIds)
    res.json({ success: true })
  }
}

export const collectionController = new CollectionController()
