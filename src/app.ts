import http from 'http'
import express, { Router } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import fileUpload from 'express-fileupload'
import expressJSDocSwagger from 'express-jsdoc-swagger'
import config from './config/config'
import logger from './config/logger'
import CorsMiddleware from './middlewares/CorsMiddleware'
import ErrorMiddleware from './middlewares/ErrorMiddleware'
import swaggerOptions from './config/swagger'
import { setupAuthRoute } from './routes/auth.route'
import { setupAccountRoute } from './routes/account.route'
import { setupUsersRoute } from './routes/users.route'

class Application {
  app: express.Application
  server: http.Server

  constructor(router?: Router) {
    this.app = express()
    this.server = http.createServer(this.app)

    new CorsMiddleware(this.app)

    this.config()
    this.router(router)

    new ErrorMiddleware(this.app)
  }

  config() {
    this.app.enable('trust proxy')

    if (config.isDev) {
      expressJSDocSwagger(this.app)(swaggerOptions)
      this.app.use(morgan('dev'))
    }
    this.app.use(helmet())
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(fileUpload())
  }

  router(router?: Router) {
    if (router) {
      // for unit testing.
      return this.app.use(router)
    }
    setupAuthRoute(this.app)
    setupAccountRoute(this.app)
    setupUsersRoute(this.app)
  }

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

  listen(): http.Server {
    this.server.listen(config.port, config.host, () => {
      logger.info('Listening on port: ' + config.port)
    })
    this.server.on('error', this.onError)
    return this.server
  }
}

export default Application
