import { orderService } from './order.service.js'
import { createOrderSchema, updateOrderStatusSchema, orderFiltersSchema } from './order.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'
import { authenticate, requireAdmin } from '../../shared/middlewares/auth.js'
import { ghtkService, GHTK_STATUS_MAP } from '../../shared/services/ghtk.service.js'

export class OrderController {
  // Public - Track order by GHTK label_id
  trackOrder = asyncHandler(async (req, res) => {
    const { labelId } = req.params

    const result = await ghtkService.getTrackingInfo(labelId)

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GHTK_ERROR',
          message: result.message,
        },
      })
      return
    }

    res.json({
      success: true,
      data: {
        labelId: result.order.label_id,
        partnerId: result.order.partner_id,
        status: result.order.status,
        statusText: result.order.status_text,
        statusVi: GHTK_STATUS_MAP[result.order.status] || result.order.status_text,
        created: result.order.created,
        modified: result.order.modified,
        pickDate: result.order.pick_date,
        deliverDate: result.order.deliver_date,
        customer: {
          fullname: result.order.customer_fullname,
          tel: result.order.customer_tel,
          address: result.order.address,
        },
        money: {
          ship: result.order.ship_money,
          pick: result.order.pick_money,
        },
        weight: result.order.weight,
      },
    })
  })

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