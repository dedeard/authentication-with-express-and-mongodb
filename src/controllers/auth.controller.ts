import { DocumentType } from '@typegoose/typegoose'
import httpStatus from 'http-status'
import { ForgotToken } from '../models/ForgotTokenModel'
import UserModel from '../models/UserModel'
import NotificationService from '../services/NotificationService'
import TokenService from '../services/TokenService'
import ApiError from '../shared/ApiError'
import ca from '../shared/catchAsync'

/**
 * POST
 * Create new user.
 *
 */
const register = ca(async (req, res, next) => {
  const { name, email, username, password } = req.body
  const user = await UserModel.create({ name, email, username, password })
  res.json({ user })
})

/**
 * POST
 * User login.
 *
 */
const login = ca(async (req, res, next) => {
  const { username, password } = req.body
  const user = await UserModel.findOne({ username })
  if (user && (await user.comparePassword(password))) {
    return res.json({
      user,
      token: {
        access: TokenService.generateAccessToken(user),
        refresh: TokenService.generateRefreshToken(user),
      },
    })
  }
  next(
    new ApiError(
      httpStatus.BAD_REQUEST,
      'Password and Username combination is invalid.',
    ),
  )
})

/**
 * DELETE
 * Revoke refresh token.
 *
 */
const revokeRefreshToken = ca(async (req, res, next) => {
  const { token } = req.body
  try {
    await TokenService.verifyRefreshToken(token, false)
    await TokenService.blacklistRefreshToken(token)
  } catch (e: any) {
    return next(new ApiError(httpStatus.BAD_REQUEST, e.message))
  }
  res.end()
})

/**
 * POST
 * Refresh access token.
 *
 */
const refreshAccessToken = ca(async (req, res, next) => {
  const token = String(req.body.token)
  let payload
  try {
    payload = await TokenService.verifyRefreshToken(token)
  } catch (e: any) {
    return next(new ApiError(httpStatus.BAD_REQUEST, e.message))
  }
  const user = await UserModel.findById(payload.uid)
  if (user) {
    return res.json({
      accessToken: TokenService.generateAccessToken(user),
    })
  }
  next(new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been deleted.'))
})

/**
 * POST
 * Send reset password email.
 *
 */
const forgotPassword = ca(async (req, res, next) => {
  const email = String(req.body.email)
  const token = await TokenService.generateForgotPasswordToken(email)
  const notif = new NotificationService()
  await notif.sendResetPasswordUrl(token, email)
  res.end()
})

/**
 * GET
 * Check reset password token.
 *
 */
const checkResetPasswordToken = ca(async (req, res, next) => {
  const token = req.query.token as string
  try {
    await TokenService.verifyForgotPasswordToken(token)
    res.end()
  } catch (e: any) {
    next(new ApiError(httpStatus.BAD_REQUEST, e.message))
  }
})

/**
 * PUT
 * Generate new password.
 *
 */
const resetPassword = ca(async (req, res, next) => {
  const token = req.query.token as string
  const pasword = req.body.password as string
  let tokenInstance: DocumentType<ForgotToken> | null
  try {
    tokenInstance = await TokenService.verifyForgotPasswordToken(token)
  } catch (e: any) {
    return next(new ApiError(httpStatus.BAD_REQUEST, e.message))
  }
  const user = await UserModel.findOne({ email: tokenInstance.email })
  if (user) {
    user.password = pasword
    await user.save()
    await tokenInstance.delete()
  } else {
    return next(
      new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been deleted.'),
    )
  }
  res.end()
})

export default {
  register,
  login,
  revokeRefreshToken,
  refreshAccessToken,
  forgotPassword,
  checkResetPasswordToken,
  resetPassword,
}
