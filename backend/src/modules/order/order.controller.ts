import { orderService } from './order.service.js'
import { createOrderSchema, updateOrderStatusSchema, orderFiltersSchema } from './order.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'

export class OrderController {
  createOrder = asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body)
    const userId = req.user?.userId as string | undefined

    const order = await orderService.createOrder(userId || null, input)

    res.status(201).json({
      success: true,
      data: order,
    })
  })

  getOrders = asyncHandler(async (req, res) => {
    const userId = req.user?.userId as string
    const filters = orderFiltersSchema.parse(req.query)

    const result = await orderService.getOrders(userId, filters)

    res.json({
      success: true,
      data: result.orders,
      meta: result.meta,
    })
  })

  getOrderByNumber = asyncHandler(async (req, res) => {
    const { orderNumber } = req.params
    const userId = req.user?.userId as string

    const order = await orderService.getOrderByNumber(orderNumber, userId)

    res.json({
      success: true,
      data: order,
    })
  })

  cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params
    const userId = req.user?.userId as string

    const order = await orderService.cancelOrder(id, userId)

    res.json({
      success: true,
      data: order,
    })
  })

  // Admin routes
  getAllOrders = asyncHandler(async (req, res) => {
    const filters = orderFiltersSchema.parse(req.query)

    const result = await orderService.getAllOrders(filters)

    res.json({
      success: true,
      data: result.orders,
      meta: result.meta,
    })
  })

  updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const input = updateOrderStatusSchema.parse(req.body)

    const order = await orderService.updateOrderStatus(id, input)

    res.json({
      success: true,
      data: order,
    })
  })

  getOrderStats = asyncHandler(async (req, res) => {
    const stats = await orderService.getOrderStats()

    res.json({
      success: true,
      data: stats,
    })
  })
}

export const orderController = new OrderController()