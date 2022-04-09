import { Application } from 'express'
import cors from 'cors'
import config from '../config/config'
import ApiError from '../shared/ApiError'

class CorsMiddleware {
  private app: Application
  private whitelists: String[]

  constructor(app: Application) {
    this.app = app
    this.whitelists = String(config.whitelistOrigins)
      .split(',')
      .filter((origin) => origin)
    if (config.isProd) {
      this.catchOrigin()
    } else {
      this.app.use(cors())
    }
  }

  catchOrigin(): void {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (this.whitelists.indexOf(String(origin)) !== -1) {
            callback(null, true)
          } else {
            callback(new ApiError(403, 'Not allowed by CORS'))
          }
        },
      }),
    )
  }
}

export default CorsMiddleware
