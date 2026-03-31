import { Request, Response } from 'express'
import { catalogService } from './catalog.service.js'
import { CreateCatalogDto, UpdateCatalogDto } from './catalog.dto.js'

export class CatalogController {
  async findAll(_req: Request, res: Response) {
    const catalogs = await catalogService.findAll()
    res.json({ success: true, data: catalogs })
  }

  async findById(req: Request, res: Response) {
    const { id } = req.params
    const catalog = await catalogService.findById(id)
    res.json({ success: true, data: catalog })
  }

  async create(req: Request, res: Response) {
    const data = CreateCatalogDto.parse(req.body)
    const catalog = await catalogService.create(data)
    res.status(201).json({ success: true, data: catalog })
  }

  async update(req: Request, res: Response) {
    const { id } = req.params
    const data = UpdateCatalogDto.parse(req.body)
    const catalog = await catalogService.update(id, data)
    res.json({ success: true, data: catalog })
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params
    await catalogService.delete(id)
    res.status(204).json({ success: true })
  }
}

export const catalogController = new CatalogController()