import { UploadedFile } from 'express-fileupload'
import ca from '../shared/catchAsync'

/**
 * GET
 * Get user profile.
 *
 */
const getProfile = ca((req, res, next) => {
  res.json({ user: req.user })
})

/**
 * PUT
 * Update user avatar.
 *
 */
const updateAvatar = ca(async (req, res, next) => {
  const image = req.files?.image as UploadedFile
  await req.user.generateAvatar(image.data)
  res.json({ user: req.user })
})

/**
 * PUT
 * Update user profile.
 *
 */
const updateProfile = ca(async (req, res) => {
  const { name, bio, username, newPassword } = req.body
  const user = req.user
  user.name = name
  user.bio = bio
  user.username = username
  if (newPassword) user.password = newPassword
  user.save()
  res.json({ user })
})

export default {
  getProfile,
  updateAvatar,
  updateProfile,
}
