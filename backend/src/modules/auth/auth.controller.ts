import { z } from 'zod'
import { authService } from './auth.service.js'
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.dto.js'
import { asyncHandler, ValidationError } from '../../shared/utils/error-handler.js'

export class AuthController {
  register = asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body)

    const result = await authService.register(input)

    res.status(201).json({
      success: true,
      data: result,
    })
  })

  login = asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body)

    const result = await authService.login(input)

    res.json({
      success: true,
      data: result,
    })
  })

  refreshToken = asyncHandler(async (req, res) => {
    const input = refreshTokenSchema.parse(req.body)

    const tokens = await authService.refreshToken(input.refreshToken)

    res.json({
      success: true,
      data: tokens,
    })
  })

  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.body.refreshToken as string
    const userId = req.user?.userId as string

    await authService.logout(userId, refreshToken)

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    })
  })

  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.userId as string

    const user = await authService.getProfile(userId)

    res.json({
      success: true,
      data: user,
    })
  })
}

export const authController = new AuthController()