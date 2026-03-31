import { AppError } from './error-handler.js'

export class ApiError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode, 'API_ERROR')
  }
}