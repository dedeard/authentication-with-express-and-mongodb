import { Application, Request, Response, NextFunction } from 'express'
import httpStatus from 'http-status'
import config from '../config/config'
import logger from '../config/logger'
import ApiError from '../shared/ApiError'

class ErrorMiddleware {
  private app: Application

  constructor(app: Application) {
    this.app = app
    this.app.use(this.catch404)
    this.app.use(this.errorConverter)
    this.app.use(this.makeErrorResponse)
  }

  /**
   * Catch not found
   *
   * @param req
   * @param res
   * @param next
   */
  catch404(req: Request, res: Response, next: NextFunction): void {
    next(new ApiError(httpStatus.NOT_FOUND, httpStatus['404_MESSAGE']))
  }

  /**
   * Converting the error.
   * @param err
   * @param req
   * @param res
   * @param next
   */
  errorConverter(
    err: ApiError | Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    let error = err
    if (err.name !== 'ApiError') {
      const statusCode = 500
      const defaultMessage = err.message || httpStatus['500_MESSAGE']
      const message = config.isDev ? defaultMessage : httpStatus['500_MESSAGE']
      error = new ApiError(statusCode, message, err.stack)
      logger.error(err)
    }
    next(error)
  }

  /**
   * Send error to client
   *
   * @param err
   * @param req
   * @param res
   * @param next
   */
  makeErrorResponse(
    err: ApiError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { statusCode, message } = err
    res.status(statusCode).json({
      statusCode,
      message,
      ...(config.isDev ? err : {}),
    })
  }
}

export default ErrorMiddleware
