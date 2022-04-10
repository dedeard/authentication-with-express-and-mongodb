import mongoose from 'mongoose'
import User from '../models/user.model'
import ca from '../shared/catchAsync'

/**
 * POST /users/fetch
 * @tags Users
 * @summary Get users.
 * @param {object} request.body
 * @example request - example without filter id
 * {
 *   "limit": 5,
 *   "offset": 0
 * }
 * @example request - example with filter id
 * {
 *   "limit": 5,
 *   "offset": 0,
 *   "ids": ["user-id-1", "user-id-2"]
 * }
 * @return {FetchUsers} 200 - Success
 */
export const fetchUsers = [
  ca(async (req, res, next) => {
    let limit = 100
    let offset = 0
    let ids: string[] = []

    if (!isNaN(Number(req.body.limit))) {
      limit = Number(req.body.limit)
      if (limit > 150) limit = 150
    }

    if (!isNaN(Number(req.body.offset))) {
      offset = Number(req.body.offset)
    }

    let query: any = {}

    if (Array.isArray(req.body.ids) && req.body.ids.length > 0) {
      ids = req.body.ids.filter((id: any) => mongoose.Types.ObjectId.isValid(id))
      query = { _id: { $in: ids } }
    }

    const getUsersQuery = User.find(query).sort({ _id: 1 }).limit(limit).skip(offset)
    const countUsersQuery = User.countDocuments(query)

    const [users, total] = await Promise.all([getUsersQuery, countUsersQuery])

    if (offset > total) offset = total

    res.json({ total, offset, users })
  }),
]
