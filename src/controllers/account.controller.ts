import Joi from 'joi'
import { UploadedFile } from 'express-fileupload'
import ca from '../shared/catchAsync'
import { passwordMatchLookup, uniqueEmailLookup } from '../shared/validationLookup'
import ApiError from '../shared/ApiError'
import { fromBuffer } from 'file-type'
import { IUserDocument } from '../models/user.model'

/**
 * GET /account
 * @tags Account
 * @summary Get profile.
 * @security BearerAuth
 * @return {User} 200 - Success
 * @return {UnauthorizedError} 401 - Unauthorized
 */
export const getProfile = [
  ca((req, res) => {
    res.json(req.user)
  }),
]

/**
 * PUT /account
 * @tags Account
 * @summary Update profile.
 * @security BearerAuth
 * @param {object} request.body
 * @example request - example payload
 * {
 *   "name": "dede aridiansya",
 *   "email": "dede@example.com",
 *   "newPassword": "newPassword",
 *   "password": "secret"
 * }
 * @return {User} 200 - Success
 * @return {UnauthorizedError} 401 - Unauthorized
 * @return {object} 422 - Failed
 * @example response - 422 - example error response
 * {
 *   "statusCode":  422,
 *   "message": "Error message",
 *   "errors":
 *    {
 *      "name": "name error message",
 *      "email": "email error message",
 *      "newPassword": "newPassword error message",
 *      "password": "password error message"
 *    }
 * }
 */
export const updateProfile = [
  ca((req, res, next) => {
    const { name, password, newPassword, email } = req.body
    const user = req.user as IUserDocument
    Joi.object({
      name: Joi.string().trim().min(3).max(30),
      email: Joi.string().trim().email().external(uniqueEmailLookup(user.id)),
      newPassword: Joi.string().trim().min(3).max(30),
      password: Joi.when('newPassword', {
        then: Joi.string().trim().required().external(passwordMatchLookup(user)),
        otherwise: Joi.when('email', {
          then: Joi.string().trim().required().external(passwordMatchLookup(user)),
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
    const user = req.user as IUserDocument
    if (name) user.name = name
    if (email) user.email = email
    if (newPassword) user.password = newPassword
    await user.save()
    res.json(user)
  }),
]

/**
 * PUT /account/avatar
 * @tags Account
 * @summary Update profile.
 * @security BearerAuth
 * @param {UpdateAvatar} request.body.required - Update avatar - multipart/form-data
 * @return {User} 200 - Success
 * @return {UnauthorizedError} 401 - Unauthorized
 * @return {object} 422 - Failed
 * @example response - 422 - example error response
 * {
 *   "statusCode":  422,
 *   "message": "Error message"
 * }
 */
export const updateAvatar = [
  ca(async (req, res, next) => {
    const image = req.files?.image
    const data: UploadedFile | undefined = Array.isArray(image) ? image[0] : image
    if (!data) {
      return next(new ApiError(422, 'Image is required'))
    }
    const mime = await fromBuffer(data.data)
    if (!['jpg', 'png', 'gif'].includes(mime?.ext || '')) {
      return next(new ApiError(422, 'Image format must be [jpg, png, gif]'))
    }
    await req.user?.generateAvatar(data.data)
    res.json(req.user)
  }),
]
