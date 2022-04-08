import express, { Application } from 'express'
import { auth } from '../middlewares/AuthMiddleware'
import C from '../controllers/account.controller'

export class AccountRoute {
  router: express.Router

  constructor() {
    this.router = express.Router()
    this.setup()
  }

  setup(): void {
    this.router.get('/', auth(), ...C.getProfile)
    this.router.put('/', auth(), ...C.updateProfile)
    this.router.put('/avatar', auth(), ...C.updateAvatar)
  }
}

export function setupAccountRoute(app: Application) {
  const router = new AccountRoute().router
  app.use('/account', router)
}
