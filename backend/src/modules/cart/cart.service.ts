import prisma from '../../config/database.js'
import { NotFoundError, ValidationError } from '../../shared/utils/error-handler.js'
import type { AddToCartInput, UpdateCartItemInput } from './cart.dto.js'

export class CartService {
  // Get cart items
  async getCart(userId: string | null, sessionId: string | null) {
    const where = userId ? { userId } : { sessionId }

    const items = await prisma.cartItem.findMany({
      where,
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { take: 1, orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    let subtotal = 0
    const cartItems = items.map(item => {
      const itemTotal = Number(item.variant.price) * item.quantity
      subtotal += itemTotal

      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        product: item.variant.product,
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
          price: item.variant.price,
          quantity: item.variant.quantity,
        },
        itemTotal,
      }
    })

    return {
      items: cartItems,
      subtotal,
      itemCount: items.length,
    }
  }

  // Add item to cart
  async addItem(userId: string | null, sessionId: string | null, input: AddToCartInput) {
    // Check if variant exists and has stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.variantId },
    })

    if (!variant) {
      throw new NotFoundError('Variant')
    }

    if (variant.quantity < input.quantity) {
      throw new ValidationError('Insufficient stock')
    }

    // Check if item already exists in cart
    const where = userId ? { userId, variantId: input.variantId } : { sessionId, variantId: input.variantId }

    const existingItem = await prisma.cartItem.findFirst({ where })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + input.quantity

      if (variant.quantity < newQuantity) {
        throw new ValidationError('Insufficient stock')
      }

      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      })
    }

    // Create new item
    return prisma.cartItem.create({
      data: {
        userId,
        sessionId,
        variantId: input.variantId,
        quantity: input.quantity,
      },
    })
  }

  // Update cart item quantity
  async updateItem(itemId: string, input: UpdateCartItemInput) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true },
    })

    if (!item) {
      throw new NotFoundError('Cart item')
    }

    if (input.quantity === 0) {
      // Remove item
      return prisma.cartItem.delete({ where: { id: itemId } })
    }

    // Check stock
    if (item.variant.quantity < input.quantity) {
      throw new ValidationError('Insufficient stock')
    }

    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: input.quantity },
    })
  }

  // Remove item from cart
  async removeItem(itemId: string) {
    const item = await prisma.cartItem.findUnique({ where: { id: itemId } })

    if (!item) {
      throw new NotFoundError('Cart item')
    }

    await prisma.cartItem.delete({ where: { id: itemId } })
  }

  // Clear cart
  async clearCart(userId: string | null, sessionId: string | null) {
    const where = userId ? { userId } : { sessionId }

    await prisma.cartItem.deleteMany({ where })
  }

  // Merge guest cart to user cart on login
  async mergeCart(guestSessionId: string, userId: string) {
    const guestItems = await prisma.cartItem.findMany({
      where: { sessionId: guestSessionId },
    })

    for (const item of guestItems) {
      // Check if user already has this variant in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: { userId, variantId: item.variantId },
      })

      if (existingItem) {
        // Merge quantities
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + item.quantity },
        })
        // Delete guest item
        await prisma.cartItem.delete({ where: { id: item.id } })
      } else {
        // Transfer to user
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { userId, sessionId: null },
        })
      }
    }
  }
}

export const cartService = new CartService()