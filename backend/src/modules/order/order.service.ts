import prisma from '../../config/database.js'
import { NotFoundError, ValidationError } from '../../shared/utils/error-handler.js'
import type { CreateOrderInput, UpdateOrderStatusInput, OrderFilters } from './order.dto.js'

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

export class OrderService {
  async createOrder(userId: string | null, input: CreateOrderInput) {
    // Validate variants and calculate prices
    const variantIds = input.items.map(item => item.variantId)
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    })

    if (variants.length !== input.items.length) {
      throw new ValidationError('Some variants do not exist')
    }

    // Check stock and calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of input.items) {
      const variant = variants.find(v => v.id === item.variantId)
      if (!variant) continue

      if (variant.quantity < item.quantity) {
        throw new ValidationError(`Insufficient stock for variant ${variant.sku}`)
      }

      const unitPrice = variant.price
      const totalPrice = unitPrice * item.quantity
      subtotal += Number(totalPrice)

      orderItems.push({
        variantId: variant.id,
        productName: variant.product.name,
        variantName: `${variant.size} - ${variant.color}`,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      })
    }

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: input.paymentMethod,
        subtotal,
        shippingFee: 0,
        total: subtotal,
        shippingFirstName: input.shippingFirstName,
        shippingLastName: input.shippingLastName,
        shippingPhone: input.shippingPhone,
        shippingAddress: input.shippingAddress,
        shippingWard: input.shippingWard,
        shippingDistrict: input.shippingDistrict,
        shippingProvince: input.shippingProvince,
        notes: input.notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    })

    // Decrease stock for each variant
    for (const item of input.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      })
    }

    return order
  }

  async getOrders(userId: string, filters: OrderFilters) {
    const { status, page, limit } = filters

    const where: any = { userId }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getOrderByNumber(orderNumber: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Check ownership
    if (order.userId && order.userId !== userId) {
      throw new NotFoundError('Order')
    }

    return order
  }

  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })

    if (!order) {
      throw new NotFoundError('Order')
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: input.status },
      include: { items: true },
    })
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } })

    if (!order) {
      throw new NotFoundError('Order')
    }

    // Check ownership
    if (order.userId && order.userId !== userId) {
      throw new NotFoundError('Order')
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'PENDING') {
      throw new ValidationError('Only pending orders can be cancelled')
    }

    // Restore stock
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    })

    for (const item of orderItems) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      })
    }

    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: { items: true },
    })
  }

  // Admin: Get all orders
  async getAllOrders(filters: OrderFilters) {
    const { status, page, limit } = filters

    const where: any = {}
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Admin: Get order stats
  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
    ])

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    }
  }
}

export const orderService = new OrderService()