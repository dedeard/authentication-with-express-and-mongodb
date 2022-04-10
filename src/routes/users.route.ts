import { Router, Application } from 'express'
import * as usersController from '../controllers/users.controller'
// import { auth } from '../middlewares/AuthMiddleware'

export const route = Router()

route.post('/fetch', ...usersController.fetchUsers)

export const setupUsersRoute = (app: Application) => {
  app.use('/users', route)
}
