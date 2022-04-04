import { checkSchema, validationResult } from 'express-validator'
import httpStatus from 'http-status'
import FileType from 'file-type'
import { UploadedFile } from 'express-fileupload'
import UserModel from '../models/UserModel'
import ApiError from '../shared/ApiError'
import ca from '../shared/catchAsync'

const updateProfile = [
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
    newPassword: {
      custom: {
        errorMessage: 'New password min 6 characters',
        options: (val) => {
          if (val && val.length < 6) {
            return false
          }
          return true
        },
      },
    },
    password: {
      custom: {
        errorMessage: 'Password is required',
        options: (val, { req }) => {
          if (req.body.newPassword && !val) {
            return false
          }
          return true
        },
      },
    },
  }),
  ca(async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new ApiError(httpStatus.BAD_REQUEST, errors.array()[0].msg))
    }
    if (await UserModel.isUsernameTaken(req.body.username, req.user.id)) {
      return next(
        new ApiError(httpStatus.BAD_REQUEST, 'Username already exists.'),
      )
    }
    if (
      req.body.newPassword &&
      !(await req.user.comparePassword(req.body.password))
    ) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'Password is invalid.'))
    }
    next()
  }),
]

const updateAvatar = ca(async (req, res, next) => {
  let image = req.files?.image
  const data: UploadedFile | undefined = Array.isArray(image) ? image[0] : image
  if (!data) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Image is required'))
  }
  const mime = await FileType.fromBuffer(data.data)
  if (!['jpg', 'png', 'gif'].includes(mime?.ext || '')) {
    return next(
      new ApiError(
        httpStatus.BAD_REQUEST,
        'Image format must be [jpg, png, gif]',
      ),
    )
  }
  req.files = { image: data }
  next()
})

export default {
  updateAvatar,
  updateProfile,
}
