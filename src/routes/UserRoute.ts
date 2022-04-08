import express, { Application } from 'express'
import { auth } from '../middlewares/AuthMiddleware'
import C from '../controllers/user.controller'

export class UserRoute {
  router: express.Router

  constructor() {
    this.router = express.Router()
    this.setup()
  }

  setup(): void {
    this.router.post('/fetch', auth(true), ...C.fetchUsers)
    this.router.post('/', auth(true), ...C.createUser)
    this.router.get('/:id', auth(true), ...C.getUser)
    this.router.put('/:id', auth(true), ...C.updateUser)
    this.router.put('/:id/avatar', auth(true), ...C.updateAvatar)
    this.router.delete('/:id', auth(true), ...C.deleteUser)
  }
}

export function setupUserRoute(app: Application) {
  const router = new UserRoute().router
  app.use('/users', router)
}
