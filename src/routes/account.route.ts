import { Router, Application } from 'express'
import * as accountController from '../controllers/account.controller'
import { auth } from '../middlewares/AuthMiddleware'

export const route = Router()

route.get('/', auth(), ...accountController.getProfile)
route.put('/', auth(), ...accountController.updateProfile)
route.put('/avatar', auth(), ...accountController.updateAvatar)

export const setupAccountRoute = (app: Application) => {
  app.use('/account', route)
}
