import { cartService } from './cart.service.js'
import { addToCartSchema, updateCartItemSchema } from './cart.dto.js'
import { asyncHandler } from '../../shared/utils/error-handler.js'
import { authenticate, optionalAuth } from '../../shared/middlewares/auth.js'

export class CartController {
  getCart = asyncHandler(async (req, res) => {
    const userId = req.user?.userId as string | undefined
    const sessionId = req.headers['x-session-id'] as string | undefined

    const cart = await cartService.getCart(userId || null, sessionId || null)

    res.json({
      success: true,
      data: cart,
    })
  })

  addItem = asyncHandler(async (req, res) => {
    const userId = req.user?.userId as string | undefined
    const sessionId = req.headers['x-session-id'] as string | undefined
    const input = addToCartSchema.parse(req.body)

    const item = await cartService.addItem(userId || null, sessionId || null, input)

    res.status(201).json({
      success: true,
      data: item,
    })
  })

  updateItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params
    const input = updateCartItemSchema.parse(req.body)

    const item = await cartService.updateItem(itemId, input)

    res.json({
      success: true,
      data: item,
    })
  })

  removeItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params

    await cartService.removeItem(itemId)

    res.json({
      success: true,
      data: { message: 'Item removed from cart' },
    })
  })

  clearCart = asyncHandler(async (req, res) => {
    const userId = req.user?.userId as string | undefined
    const sessionId = req.headers['x-session-id'] as string | undefined

    await cartService.clearCart(userId || null, sessionId || null)

    res.json({
      success: true,
      data: { message: 'Cart cleared' },
    })
  })

  mergeCart = asyncHandler(async (req, res) => {
    const userId = req.user?.userId as string
    const guestSessionId = req.headers['x-session-id'] as string

    await cartService.mergeCart(guestSessionId, userId)

    const cart = await cartService.getCart(userId, null)

    res.json({
      success: true,
      data: cart,
    })
  })
}

export const cartController = new CartController()