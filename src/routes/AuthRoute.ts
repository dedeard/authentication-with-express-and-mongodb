import express, { Application } from 'express'
import C from '../controllers/auth.controller'
import V from '../validators/auth.validator'

export class AuthRoute {
  router: express.Router

  constructor() {
    this.router = express.Router()
    this.setup()
  }

  setup(): void {
    this.router.post('/register', ...V.register, C.register)
    this.router.post('/login', ...V.login, C.login)
    this.router.post('/refresh-access-token', C.refreshAccessToken)
    this.router.delete('/revoke-refresh-token', C.revokeRefreshToken)
    this.router.post('/password', ...V.forgotPassword, C.forgotPassword)
    this.router.get(
      '/password',
      ...V.checkResetPasswordToken,
      C.checkResetPasswordToken,
    )
    this.router.put('/password', ...V.resetPassword, C.resetPassword)
  }
}

export function setupAuthRoute(app: Application) {
  const router = new AuthRoute().router
  app.use('/auth', router)
}
