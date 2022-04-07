import { checkSchema, validationResult } from 'express-validator'
import FileType from 'file-type'
import { UploadedFile } from 'express-fileupload'
import UserModel from '../models/UserModel'
import ApiError from '../shared/ApiError'
import ca from '../shared/catchAsync'

const createUser = [
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
      return next(new ApiError(400, errors.array()[0].msg))
    }
    if (await UserModel.isUsernameTaken(req.body.username)) {
      return next(new ApiError(400, 'Username already exists.'))
    }
    if (await UserModel.isEmailTaken(req.body.email)) {
      return next(new ApiError(400, 'Email already exists.'))
    }
    next()
  }),
]

const updateUser = [
  ca(async (req, res, next) => {
    try {
      const count = await UserModel.countDocuments({ _id: req.params.id })
      if (count > 0) {
        return next()
      }
    } catch (e: any) {}
    next(new ApiError(404, 'User not found.'))
  }),
  checkSchema({
    name: {
      trim: true,
      isLength: {
        errorMessage: 'Name min 3 and max 20 characters',
        options: { min: 3, max: 20 },
      },
    },
    bio: {
      isLength: {
        errorMessage: 'Bio max 250 characters',
        options: { max: 250 },
      },
    },
    admin: {
      isBoolean: {
        errorMessage: 'Admin field is required',
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
      custom: {
        errorMessage: 'Password min 6 characters',
        options: (val) => {
          if (val && val.length < 6) {
            return false
          }
          return true
        },
      },
    },
  }),
  ca(async (req, res, next) => {
    let image = req.files?.image
    const data: UploadedFile | undefined = Array.isArray(image)
      ? image[0]
      : image
    if (!data) {
      return next()
    }
    const mime = await FileType.fromBuffer(data.data)
    if (!['jpg', 'png', 'gif'].includes(mime?.ext || '')) {
      return next(new ApiError(400, 'Image format must be [jpg, png, gif]'))
    }
    req.files = { image: data }
    next()
  }),
  ca(async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new ApiError(400, errors.array()[0].msg))
    }
    if (await UserModel.isUsernameTaken(req.body.username, req.params.id)) {
      return next(new ApiError(400, 'Username already exists.'))
    }
    if (await UserModel.isEmailTaken(req.body.email, req.params.id)) {
      return next(new ApiError(400, 'Email already exists.'))
    }
    next()
  }),
]

const deleteUser = [
  ca(async (req, res, next) => {
    const count = await UserModel.countDocuments({ _id: req.params.id })
    if (count === 0) {
      return next(new ApiError(404, 'User not found.'))
    }
    next()
  }),
]

export default {
  createUser,
  updateUser,
  deleteUser,
}
