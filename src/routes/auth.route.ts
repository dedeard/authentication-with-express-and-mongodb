import { Router, Application } from 'express'
import * as authController from '../controllers/auth.controller'

export const route = Router()

route.post('/register', ...authController.register)
route.post('/login', ...authController.login)
route.post('/password', ...authController.forgotPassword)
route.put('/password', ...authController.resetPassword)
route.post('/refresh-access-token', ...authController.refreshAccessToken)
route.delete('/revoke-refresh-token', ...authController.revokeRefreshToken)

export const setupAuthRoute = (app: Application) => {
  app.use('/auth', route)
}
