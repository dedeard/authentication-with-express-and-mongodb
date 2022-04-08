import Joi from 'joi'
import { UploadedFile } from 'express-fileupload'
import ca from '../shared/catchAsync'
import { passwordMatchLookup, uniqueEmailLookup } from '../shared/validationLookup'
import ApiError from '../shared/ApiError'
import { fromBuffer } from 'file-type'

/**
 * GET
 * Get user profile.
 *
 */
const getProfile = [
  ca((req, res, next) => {
    res.json({ user: req.user })
  }),
]

/**
 * PUT
 * Update user avatar.
 *
 */
const updateAvatar = [
  ca(async (req, res, next) => {
    const image = req.files?.image
    const data: UploadedFile | undefined = Array.isArray(image) ? image[0] : image
    if (!data) {
      return next(new ApiError(400, 'Image is required'))
    }
    const mime = await fromBuffer(data.data)
    if (!['jpg', 'png', 'gif'].includes(mime?.ext || '')) {
      return next(new ApiError(422, 'Image format must be [jpg, png, gif]'))
    }
    await req.user.generateAvatar(data.data)
    res.json({ user: req.user })
  }),
]

/**
 * PUT
 * Update user profile.
 *
 */
const updateProfile = [
  ca((req, res, next) => {
    const { name, password, newPassword, email } = req.body
    Joi.object({
      name: Joi.string().trim().alphanum().min(3).max(30),
      email: Joi.string().trim().email().external(uniqueEmailLookup(req.user.id)),
      newPassword: Joi.string().trim().min(3).max(30),
      password: Joi.when('newPassword', {
        then: Joi.string().trim().required().external(passwordMatchLookup(req.user)),
        otherwise: Joi.when('email', {
          then: Joi.string().trim().required().external(passwordMatchLookup(req.user)),
        }),
      }),
    })
      .validateAsync({ password, name, newPassword, email }, { abortEarly: false })
      .then((data) => {
        req.body = data
        next()
      })
      .catch((e) => {
        next(new ApiError(422, 'Failed to update your profile.', e))
      })
  }),
  ca(async (req, res) => {
    const { name, newPassword, email } = req.body
    const user = req.user
    if (name) user.name = name
    if (email) user.email = email
    if (newPassword) user.password = newPassword
    await user.save()
    res.json({ user })
  }),
]

export default {
  getProfile,
  updateAvatar,
  updateProfile,
}
