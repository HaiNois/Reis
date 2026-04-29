import prisma from '../../config/database.js'
import { ForbiddenError, NotFoundError } from '../../shared/utils/error-handler.js'
import type { ListUsersQuery, UpdateUserInput } from './user.dto.js'

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { orders: true },
  },
} as const

export class UserService {
  async listUsers(query: ListUsersQuery) {
    const { page, limit, search, role } = query

    const where: any = {}

    if (role) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async updateUser(id: string, input: UpdateUserInput, currentUserId: string) {
    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Prevent admin from demoting themselves
    if (id === currentUserId && input.role && input.role !== user.role) {
      throw new ForbiddenError('Cannot change your own role')
    }

    return prisma.user.update({
      where: { id },
      data: input,
      select: USER_SELECT,
    })
  }

  async deleteUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenError('Cannot delete your own account')
    }

    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
      throw new NotFoundError('User')
    }

    await prisma.user.delete({ where: { id } })

    return { id }
  }
}

export const userService = new UserService()
