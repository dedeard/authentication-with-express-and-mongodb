import Joi from 'joi'
import Forgot, { IForgotDocument } from '../models/forgot.model'
import User from '../models/user.model'
import * as jwtService from '../services/jwt.service'
import NotificationService from '../services/notification.service'
import ApiError from '../shared/ApiError'
import ca from '../shared/catchAsync'
import { registeredEmailLookup, uniqueEmailLookup } from '../shared/validationLookup'

/**
 * POST /auth/register
 * @tags Auth - everything about authentication.
 * @summary Create new account.
 * @param {object} request.body.required
 * @example request - example payload
 * {
 *   "name": "dede aridiansya",
 *   "email": "dede@example.com",
 *   "password": "secret"
 * }
 * @return 204 - Success
 * @return {object} 422 - Failed
 * @example response - 422 - example error response
 * {
 *   "statusCode":  422,
 *   "message": "Error message",
 *   "errors":
 *    {
 *      "name": "name error message",
 *      "email": "email error message",
 *      "password": "password error message"
 *    }
 * }
 */
export const register = [
  ca((req, res, next) => {
    const { name, email, password } = req.body
    Joi.object({
      name: Joi.string().trim().min(3).max(30).required(),
      password: Joi.string().trim().min(3).max(30).required(),
      email: Joi.string().trim().email().required().external(uniqueEmailLookup()),
    })
      .validateAsync({ email, password, name }, { abortEarly: false })
      .then((data) => {
        req.body = data
        next()
      })
      .catch((err) => {
        next(new ApiError(422, 'Failed register.', err))
      })
  }),
  ca(async (req, res) => {
    await User.create(req.body)
    res.sendStatus(204)
  }),
]

/**
 * POST /auth/login
 * @tags Auth
 * @summary Login with email and password.
 * @param {object} request.body.required
 * @example request - example payload
 * {
 *   "email": "dede@example.com",
 *   "password": "secret"
 * }
 * @return {UserLogin} 200 - Success
 * @return {object} 422 - Failed
 * @return {object} 400 - Failed
 * @example response - 422 - example error response
 * {
 *   "statusCode":  422,
 *   "message": "Error message",
 *   "errors":
 *    {
 *      "name": "name error message",
 *      "password": "password error message"
 *    }
 * }
 * @example response - 400 - example error response
 * {
 *   "statusCode":  400,
 *   "message": "Error message"
 * }
 */
export const login = [
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
      .catch((err) => {
        next(new ApiError(422, 'Failed login.', err))
      })
  }),
  ca(async (req, res, next) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (user && (await user.comparePassword(password))) {
      return res.json({
        user,
        token: {
          access: jwtService.generateAccessToken(user),
          refresh: jwtService.generateRefreshToken(user),
        },
      })
    }
    next(new ApiError(400, 'Password and Username combination is invalid.'))
  }),
]

/**
 * POST /auth/password
 * @tags Auth
 * @summary Send a password reset email to replace the forgotten password.
 * @param {object} request.body.required
 * @example request - example payload
 * {
 *   "email": "dede@example.com"
 * }
 * @return 204 - Success
 * @return {object} 422 - Failed
 * @example response - 422 - example error response
 * {
 *   "statusCode":  422,
 *   "message": "Error message",
 *   "errors":
 *    {
 *      "email": "email error message"
 *    }
 * }
 */
export const forgotPassword = [
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
      .catch((err) => {
        next(new ApiError(422, 'Failed to generate forgotten password url.', err))
      })
  }),
  ca(async (req, res) => {
    const email = String(req.body.email)
    const token = await Forgot.generateForgotPasswordToken(email)
    const notif = new NotificationService()
    await notif.sendResetPasswordUrl(token, email)
    res.sendStatus(204)
  }),
]

/**
 * PUT /auth/password
 * @tags Auth
 * @summary Update forgotten password.
 * @param {object} request.body.required
 * @example request - example payload
 * {
 *   "token": "string",
 *   "password": "secret"
 * }
 * @return 204 - Success
 * @return {object} 422 - Failed
 * @return {object} 400 - Failed
 * @example response - 422 - example error response
 * {
 *   "statusCode":  422,
 *   "message": "Error message",
 *   "errors":
 *    {
 *      "token": "token error message",
 *      "password": "password error message"
 *    }
 * }
 * @example response - 400 - example error response
 * {
 *   "statusCode":  400,
 *   "message": "Error message"
 * }
 */
export const resetPassword = [
  ca((req, res, next) => {
    const { password, token } = req.body
    Joi.object({
      token: Joi.string().required(),
      password: Joi.string().trim().min(3).max(30).required(),
    })
      .validateAsync({ password, token }, { abortEarly: false })
      .then((data) => {
        req.body = data
        next()
      })
      .catch((e) => {
        next(new ApiError(422, 'Failed to reset your password.', e))
      })
  }),
  ca(async (req, res, next) => {
    const token = req.body.token as string
    const pasword = req.body.password as string
    let tokenInstance: IForgotDocument | null
    try {
      tokenInstance = await Forgot.verifyForgotPasswordToken(token)
    } catch (e: any) {
      return next(new ApiError(400, e.message))
    }
    const user = await User.findOne({ email: tokenInstance.email })
    if (user) {
      user.password = pasword
      await user.save()
      await tokenInstance.delete()
    } else {
      return next(new ApiError(400, 'Your account has been deleted.'))
    }
    res.sendStatus(204)
  }),
]

/**
 * POST /auth/refresh-access-token
 * @tags Auth
 * @summary Generate new access token.
 * @param {object} request.body.required
 * @example request - example payload
 * {
 *   "refreshToken": "string"
 * }
 * @return {object} 204 - Success
 * @return {object} 400 - Failed
 * @example response - 200 - example success response
 * {
 *   "accessToken": "string"
 * }
 * @example response - 400 - example error response
 * {
 *   "statusCode":  400,
 *   "message": "Refresh token has been expired"
 * }
 */
export const refreshAccessToken = [
  ca(async (req, res, next) => {
    const token = String(req.body.refreshToken)
    let payload
    try {
      payload = await jwtService.verifyRefreshToken(token)
    } catch (e: any) {
      return next(new ApiError(400, e.message))
    }
    const user = await User.findById(payload.uid)
    if (user) {
      return res.json({
        accessToken: jwtService.generateAccessToken(user),
      })
    }
    next(new ApiError(400, 'Your account has been deleted.'))
  }),
]

/**
 * DELETE /auth/revoke-refresh-token
 * @tags Auth
 * @summary Revoke refresh token.
 * @param {object} request.body.required
 * @example request - example payload
 * {
 *   "refreshToken": "string"
 * }
 * @return 204 - Success
 * @return {object} 400 - Failed
 * @example response - 400 - example error response
 * {
 *   "statusCode":  400,
 *   "message": "Refresh token has been expired"
 * }
 */
export const revokeRefreshToken = [
  ca(async (req, res, next) => {
    const { refreshToken } = req.body
    try {
      await jwtService.blacklistRefreshToken(refreshToken)
    } catch (e: any) {
      return next(new ApiError(400, e.message))
    }
    res.sendStatus(204)
  }),
]
