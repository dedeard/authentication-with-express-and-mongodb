import express, { Application } from 'express'
import { auth } from '../middlewares/AuthMiddleware'
import C from '../controllers/user.controller'
import V from '../validators/user.validator'

export class UserRoute {
  router: express.Router

  constructor() {
    this.router = express.Router()
    this.setup()
  }

  setup(): void {
    this.router.post('/', C.getUsers)
    this.router.post('/create', auth(true), ...V.createUser, C.createUser)
    this.router.put('/:id', auth(true), ...V.updateUser, C.updateUser)
    this.router.delete('/:id', auth(true), ...V.deleteUser, C.deleteUser)
  }
}

export function setupUserRoute(app: Application) {
  const router = new UserRoute().router
  app.use('/user', router)
}
