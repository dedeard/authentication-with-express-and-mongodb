import { UploadedFile } from 'express-fileupload'
import mongoose from 'mongoose'
import Joi from 'joi'
import UserModel, { User } from '../models/UserModel'
import ca from '../shared/catchAsync'
import { uniqueEmailLookup } from '../shared/validationLookup'
import ApiError from '../shared/ApiError'
import { DocumentType } from '@typegoose/typegoose'
import { fromBuffer } from 'file-type'

/**
 * POST
 * Fetch users.
 *
 * @param req
 * @param res
 */
const fetchUsers = [
  ca(async (req, res, next) => {
    let limit = 100
    let offset = 0
    let ids: string[] = []

    if (!isNaN(Number(req.body.limit))) {
      limit = Number(req.body.limit)
      if (limit > 100) limit = 100
    }

    if (!isNaN(Number(req.body.offset))) {
      offset = Number(req.body.offset)
    }

    if (Array.isArray(req.body.ids) && req.body.ids.length > 0) {
      ids = req.body.ids.filter((id: any) => mongoose.Types.ObjectId.isValid(id))
    }

    const query = ids.length > 0 ? { _id: { $in: ids } } : {}
    const [users, total] = await Promise.all([
      UserModel.find(query).sort({ name: 1 }).limit(limit).skip(offset),
      UserModel.countDocuments(query),
    ])

    if (offset > total) offset = total

    res.json({ total, offset, users })
  }),
]

/**
 * POST
 * Create new user.
 *
 */
const createUser = [
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
        next(new ApiError(422, 'Failed to create user.', e))
      })
  }),
  ca(async (req, res, next) => {
    const user = await UserModel.create(req.body)
    res.json({ user })
  }),
]

/**
 * GET
 * Get user.
 *
 */
const getUser = [
  ca(async (req, res, next) => {
    let user: DocumentType<User> | null = null
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      user = await UserModel.findById(req.params.id)
    }
    if (!user) {
      return next(new ApiError(404, 'UserId is not valid.'))
    }
    res.json({ user })
  }),
]

/**
 * PUT
 * Update user.
 *
 */
const updateUser = [
  ca(async (req, res, next) => {
    const { name, email, password, admin } = req.body

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      // @ts-ignore
      req.target = await UserModel.findById(req.params.id)
    }
    // @ts-ignore
    if (!req.target) {
      return next(new ApiError(404, 'UserId is not valid.'))
    }
    Joi.object({
      name: Joi.string().trim().alphanum().min(3).max(30),
      password: Joi.string().trim().min(3).max(30),
      admin: Joi.boolean(),
      email: Joi.string().trim().email().external(uniqueEmailLookup(req.params.id)),
    })
      .validateAsync({ password, name, email, admin }, { abortEarly: false })
      .then((data) => {
        req.body = data
        next()
      })
      .catch((e) => {
        next(new ApiError(422, 'Failed to update user.', e))
      })
  }),
  ca(async (req, res) => {
    const { name, email, password, admin } = req.body
    // @ts-ignore
    const user = req.target as DocumentType<User>
    if (name) user.name = name
    if (email) user.email = email
    if (typeof admin === 'boolean') user.admin = admin
    if (password) user.password = password
    await user.save()
    res.json({ user })
  }),
]

/**
 * PUT
 * Update user avatar.
 *
 */
const updateAvatar = [
  ca(async (req, res, next) => {
    let user: DocumentType<User> | null = null
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      user = await UserModel.findById(req.params.id)
    }
    if (!user) {
      return next(new ApiError(404, 'UserId is not valid.'))
    }

    const image = req.files?.image
    const data: UploadedFile | undefined = Array.isArray(image) ? image[0] : image
    if (!data) {
      return next(new ApiError(400, 'Image is required'))
    }
    const mime = await fromBuffer(data.data)
    if (!['jpg', 'png', 'gif'].includes(mime?.ext || '')) {
      return next(new ApiError(422, 'Image format must be [jpg, png, gif]'))
    }
    await user.generateAvatar(data.data)
    res.json({ user })
  }),
]

/**
 * DELETE
 * Delete user.
 *
 */
const deleteUser = [
  ca(async (req, res, next) => {
    let user: DocumentType<User> | null = null
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      user = await UserModel.findById(req.params.id)
    }
    if (!user) {
      return next(new ApiError(404, 'UserId is not valid.'))
    }
    await user.deleteAvatar()
    await user.delete()
    res.end()
  }),
]

export default {
  fetchUsers,
  createUser,
  getUser,
  updateUser,
  updateAvatar,
  deleteUser,
}
