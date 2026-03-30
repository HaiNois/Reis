import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../../config/database.js'
import { env } from '../../config/env.js'
import { NotFoundError, UnauthorizedError } from '../../shared/utils/error-handler.js'
import type { RegisterInput, LoginInput } from './auth.dto.js'

export class AuthService {
  async register(input: RegisterInput) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new UnauthorizedError('Email already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    })

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role)

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken)

    return {
      user,
      ...tokens,
    }
  }

  async login(input: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw new UnauthorizedError('Invalid credentials')
    }

    // Verify password
    const isValid = await bcrypt.compare(input.password, user.password)

    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials')
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role)

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string
        email: string
        role: string
      }

      // Check if token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      })

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired refresh token')
      }

      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      })

      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId, decoded.email, decoded.role)

      // Save new refresh token
      await this.saveRefreshToken(decoded.userId, tokens.refreshToken)

      return tokens
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token')
    }
  }

  async logout(userId: string, refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    })
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  private generateTokens(userId: string, email: string, role: string) {
    const accessToken = jwt.sign(
      { userId, email, role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY }
    )

    const refreshToken = jwt.sign(
      { userId, email, role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRY }
    )

    return { accessToken, refreshToken }
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    })
  }
}

export const authService = new AuthService()