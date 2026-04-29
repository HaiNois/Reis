import { userService } from './user.service.js'
import { listUsersQuerySchema, updateUserSchema } from './user.dto.js'
import { asyncHandler, UnauthorizedError } from '../../shared/utils/error-handler.js'

export class UserController {
  listUsers = asyncHandler(async (req, res) => {
    const query = listUsersQuerySchema.parse(req.query)

    const result = await userService.listUsers(query)

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    })
  })

  getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id)

    res.json({
      success: true,
      data: user,
    })
  })

  updateUser = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.userId as string
    if (!currentUserId) {
      throw new UnauthorizedError('Missing authenticated user')
    }

    const input = updateUserSchema.parse(req.body)

    const user = await userService.updateUser(req.params.id, input, currentUserId)

    res.json({
      success: true,
      data: user,
    })
  })

  deleteUser = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.userId as string
    if (!currentUserId) {
      throw new UnauthorizedError('Missing authenticated user')
    }

    const result = await userService.deleteUser(req.params.id, currentUserId)

    res.json({
      success: true,
      data: result,
    })
  })
}

export const userController = new UserController()
