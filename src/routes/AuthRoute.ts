import express, { Application } from 'express'
import C from '../controllers/auth.controller'

export class AuthRoute {
  router: express.Router

  constructor() {
    this.router = express.Router()
    this.setup()
  }

  setup(): void {
    this.router.post('/register', ...C.register)
    this.router.post('/login', ...C.login)
    this.router.post('/refresh-access-token', ...C.refreshAccessToken)
    this.router.delete('/revoke-refresh-token', ...C.revokeRefreshToken)
    this.router.post('/password', ...C.forgotPassword)
    this.router.get('/password', ...C.checkResetPasswordToken)
    this.router.put('/password', ...C.resetPassword)
  }
}

export function setupAuthRoute(app: Application) {
  const router = new AuthRoute().router
  app.use('/auth', router)
}
