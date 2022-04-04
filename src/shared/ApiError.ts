/**
 * For error response
 *
 */
class ApiError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string, stack?: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.stack = stack
  }
}

export default ApiError
