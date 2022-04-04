import express, { Application } from 'express'
import { auth } from '../middlewares/AuthMiddleware'
import C from '../controllers/account.controller'
import V from '../validators/account.validator'

export class AccountRoute {
  router: express.Router

  constructor() {
    this.router = express.Router()
    this.setup()
  }

  setup(): void {
    this.router.get('/profile', auth(), C.getProfile)
    this.router.put('/avatar', auth(), V.updateAvatar, C.updateAvatar)
    this.router.put('/profile', auth(), ...V.updateProfile, C.updateProfile)
  }
}

export function setupAccountRoute(app: Application) {
  const router = new AccountRoute().router
  app.use('/account', router)
}
