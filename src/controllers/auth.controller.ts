import { DocumentType } from '@typegoose/typegoose'
import Joi from 'joi'
import { ForgotToken } from '../models/ForgotTokenModel'
import UserModel from '../models/UserModel'
import NotificationService from '../services/NotificationService'
import TokenService from '../services/TokenService'
import ApiError from '../shared/ApiError'
import ca from '../shared/catchAsync'
import { registeredEmailLookup, uniqueEmailLookup } from '../shared/validationLookup'

/**
 * POST
 * Create new user.
 *
 */
const register = [
  ca((req, res, next) => {
    const { name, email, password } = req.body
    Joi.object({
      name: Joi.string().trim().alphanum().min(3).max(30).required(),
      password: Joi.string().trim().min(3).max(30).required(),
      email: Joi.string().trim().email().required().external(uniqueEmailLookup()),
    })
      .validateAsync({ email, password, name }, { abortEarly: false })
      .then((data) => {
        req.body = data
        next()
      })
      .catch((e) => {
        next(new ApiError(422, 'Failed register.', e))
      })
  }),
  ca(async (req, res) => {
    const user = await UserModel.create(req.body)
    res.json({ user })
  }),
]

/**
 * POST
 * User login.
 *
 */
const login = [
  ca((req, res, next) => {
    const { email, password } = req.body
    Joi.object({
      password: Joi.string().trim().required(),
      email: Joi.string().trim().email().required(),
    })
      .validateAsync({ email, password }, { abortEarly: false })
      .then((data) => {
        req.body = data
        next()
      })
      .catch((e) => {
        next(new ApiError(422, 'Failed login.', e))
      })
  }),
  ca(async (req, res, next) => {
    const { email, password } = req.body
    const user = await UserModel.findOne({ email })
    if (user && user.comparePassword(password)) {
      return res.json({
        user,
        token: {
          access: TokenService.generateAccessToken(user),
          refresh: TokenService.generateRefreshToken(user),
        },
      })
    }
    next(new ApiError(422, 'Password and Username combination is invalid.'))
  }),
]

/**
 * DELETE
 * Revoke refresh token.
 *
 */
const revokeRefreshToken = [
  ca(async (req, res, next) => {
    const { token } = req.body
    try {
      await TokenService.verifyRefreshToken(token, false)
      await TokenService.blacklistRefreshToken(token)
    } catch (e: any) {
      return next(new ApiError(400, e.message))
    }
    res.end()
  }),
]

/**
 * POST
 * Refresh access token.
 *
 */
const refreshAccessToken = [
  ca(async (req, res, next) => {
    const token = String(req.body.token)
    let payload
    try {
      payload = await TokenService.verifyRefreshToken(token)
    } catch (e: any) {
      return next(new ApiError(400, e.message))
    }
    const user = await UserModel.findById(payload.uid)
    if (user) {
      return res.json({
        accessToken: TokenService.generateAccessToken(user),
      })
    }
    next(new ApiError(401, 'Your account has been deleted.'))
  }),
]

/**
 * POST
 * Send reset password email.
 *
 */
const forgotPassword = [
  ca((req, res, next) => {
    const { email } = req.body
    Joi.object({
      email: Joi.string().trim().email().required().external(registeredEmailLookup()),
    })
      .validateAsync({ email }, { abortEarly: false })
      .then((data) => {
        req.body = data
        next()
      })
      .catch((e) => {
        next(new ApiError(422, 'Failed to generate forgotten password url.', e))
      })
  }),
  ca(async (req, res, next) => {
    const email = String(req.body.email)
    const token = await TokenService.generateForgotPasswordToken(email)
    const notif = new NotificationService()
    await notif.sendResetPasswordUrl(token, email)
    res.end()
  }),
]

/**
 * GET
 * Check reset password token.
 *
 */
const checkResetPasswordToken = [
  ca(async (req, res, next) => {
    const { token } = req.query
    if (!token) {
      return next(new ApiError(400, 'Reset password token is required.'))
    }
    try {
      await TokenService.verifyForgotPasswordToken(String(token))
      res.end()
    } catch (e: any) {
      next(new ApiError(422, e.message))
    }
  }),
]

/**
 * PUT
 * Generate new password.
 *
 */
const resetPassword = [
  ca((req, res, next) => {
    const { token } = req.query
    const { password } = req.body
    if (!token) {
      return next(new ApiError(400, 'Reset password token is required.'))
    }
    Joi.object({
      password: Joi.string().trim().min(3).max(30).required(),
    })
      .validateAsync({ password }, { abortEarly: false })
      .then((data) => {
        req.body = data
        next()
      })
      .catch((e) => {
        next(new ApiError(422, 'Failed to reset your password.', e))
      })
  }),
  ca(async (req, res, next) => {
    const token = req.query.token as string
    const pasword = req.body.password as string
    let tokenInstance: DocumentType<ForgotToken> | null
    try {
      tokenInstance = await TokenService.verifyForgotPasswordToken(token)
    } catch (e: any) {
      return next(new ApiError(400, e.message))
    }

    const user = await UserModel.findOne({ email: tokenInstance.email })
    if (user) {
      user.password = pasword
      await user.save()
      await tokenInstance.delete()
    } else {
      return next(new ApiError(401, 'Your account has been deleted.'))
    }
    res.end()
  }),
]

export default {
  register,
  login,
  revokeRefreshToken,
  refreshAccessToken,
  forgotPassword,
  checkResetPasswordToken,
  resetPassword,
}
