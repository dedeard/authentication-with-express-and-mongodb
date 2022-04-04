import { checkSchema, validationResult } from 'express-validator'
import httpStatus from 'http-status'
import UserModel from '../models/UserModel'
import ApiError from '../shared/ApiError'
import ca from '../shared/catchAsync'

const register = [
  checkSchema({
    name: {
      trim: true,
      isLength: {
        errorMessage: 'Name min 3 and max 20 characters',
        options: { min: 3, max: 20 },
      },
    },
    username: {
      trim: true,
      toLowerCase: true,
      isLength: {
        errorMessage: 'Username min 6 characters',
        options: { min: 6 },
      },
      custom: {
        errorMessage: 'Invalid username format',
        options: (val) => val.match(/^(?![_.])(?!.*[_]{2})[a-z0-9_]+(?<![_])$/),
      },
    },
    email: {
      trim: true,
      normalizeEmail: true,
      isEmail: {
        errorMessage: 'Invalid email format',
      },
    },
    password: {
      isLength: {
        errorMessage: 'Password min 6 characters',
        options: { min: 6 },
      },
    },
  }),
  ca(async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg))
    }
    if (await UserModel.isUsernameTaken(req.body.username)) {
      return next(
        new ApiError(httpStatus.BAD_REQUEST, 'Username already exists.'),
      )
    }
    if (await UserModel.isEmailTaken(req.body.email)) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Email already exists.'))
    }
    next()
  }),
]

const login = [
  checkSchema({
    username: {
      trim: true,
      toLowerCase: true,
      isLength: {
        errorMessage: 'Username is required',
        options: { min: 1 },
      },
    },
    password: {
      isLength: {
        errorMessage: 'Password is required',
        options: { min: 1 },
      },
    },
  }),
  ca((req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg))
    }
    next()
  }),
]

const forgotPassword = [
  checkSchema({
    email: {
      trim: true,
      normalizeEmail: true,
      isEmail: {
        errorMessage: 'Invalid email format',
      },
    },
  }),
  ca(async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg))
    }
    if (!(await UserModel.isEmailTaken(req.body.email))) {
      return next(
        new ApiError(httpStatus.BAD_REQUEST, 'Email is not registered.'),
      )
    }
    next()
  }),
]

const checkResetPasswordToken = [
  checkSchema({
    token: {
      trim: true,
      isLength: {
        errorMessage: 'Reset password token is required',
        options: { min: 1 },
      },
    },
  }),
  ca((req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg))
    }
    next()
  }),
]

const resetPassword = [
  checkSchema({
    token: {
      trim: true,
      isLength: {
        errorMessage: 'Reset password token is required',
        options: { min: 1 },
      },
    },
    password: {
      isLength: {
        errorMessage: 'Password min 6 characters',
        options: { min: 6 },
      },
    },
  }),
  ca((req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg))
    }
    next()
  }),
]

export default {
  register,
  login,
  forgotPassword,
  checkResetPasswordToken,
  resetPassword,
}
