import { Application } from 'express'
import httpStatus from 'http-status'
import config from '../config/config'
import cors from 'cors'
import ApiError from '../shared/ApiError'

class CorsMiddleware {
  private app: Application
  private whitelists: String[]

  constructor(app: Application) {
    this.app = app
    this.whitelists = String(config.whitelistOrigins)
      .split(',')
      .filter((origin) => origin)
    if (!config.isDev) {
      this.catchOrigin()
    }
  }

  /**
   * Catch not found
   *
   * @param req
   * @param res
   * @param next
   */
  catchOrigin(): void {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (this.whitelists.indexOf(String(origin)) !== -1) {
            callback(null, true)
          } else {
            callback(new ApiError(httpStatus.FORBIDDEN, 'Not allowed by CORS'))
          }
        },
      }),
    )
  }
}

export default CorsMiddleware
