import http from 'http'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import fileUpload from 'express-fileupload'
import config from './config/config'
import logger from './config/logger'
import ErrorMiddleware from './middlewares/ErrorMiddleware'
import CorsMiddleware from './middlewares/CorsMiddleware'

class Application {
  app: express.Application
  server: http.Server

  constructor() {
    this.app = express()
    this.server = http.createServer(this.app)

    new CorsMiddleware(this.app)

    this.config()
    this.router()

    new ErrorMiddleware(this.app)
  }

  /**
   * Express configuration
   *
   */
  config() {
    // Settings
    this.app.enable('trust proxy')

    // Middleware
    if (config.isDev) this.app.use(morgan('dev'))
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(fileUpload())
    this.app.use(helmet())
  }

  router() {
    this.app.get('/', (req, res) => {
      res.send('hallo world!')
    })
  }

  /**
   * Handling server error
   *
   * @param error
   */
  onError(error: any) {
    if (error.syscall !== 'listen') throw error
    switch (error.code) {
      case 'EACCES':
        logger.error(`Port ${config.port} requires elevated privileges`)
        process.exit(1)
      case 'EADDRINUSE':
        logger.error(`Port ${config.port} is already in use`)
        process.exit(1)
      default:
        throw error
    }
  }

  /**
   * Listening server
   *
   * @returns
   */
  listen(): http.Server {
    this.server.listen(config.port, config.host, () => {
      logger.info('Listening on port: ' + config.port)
    })
    this.server.on('error', this.onError)
    return this.server
  }
}

export default Application
