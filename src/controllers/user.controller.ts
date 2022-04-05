import { UploadedFile } from 'express-fileupload'
import mongoose from 'mongoose'
import UserModel from '../models/UserModel'
import ca from '../shared/catchAsync'

/**
 * POST
 * Get users.
 *
 * @param req
 * @param res
 */
const getUsers = ca(async (req, res, next) => {
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
})

/**
 * POST
 * Create new user.
 *
 */
const createUser = ca(async (req, res, next) => {
  const { name, email, username, password } = req.body
  const user = await UserModel.create({ name, email, username, password })
  res.json({ user })
})

/**
 * PUT
 * Update user.
 *
 */
const updateUser = ca(async (req, res, next) => {
  const { name, email, username, password, bio, admin } = req.body
  const image = req.files?.image
  const user = await UserModel.findById(req.params.id)
  if (user) {
    user.name = name
    user.email = email
    user.username = username
    user.bio = bio
    user.admin = admin
    if (password) user.password = password
    await user.save()
    if (image) {
      await user.generateAvatar((image as UploadedFile).data)
    }
  }
  res.json({ user })
})

/**
 * DELETE
 * Delete user.
 *
 */
const deleteUser = ca(async (req, res, next) => {
  const user = await UserModel.findById(req.params.id)
  await user?.deleteAvatar()
  await user?.delete()
  res.end()
})

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
}
