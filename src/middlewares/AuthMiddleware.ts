import { NextFunction, Request, Response } from 'express'
import httpStatus from 'http-status'
import UserModel from '../models/UserModel'
import ca from '../shared/catchAsync'
import ApiError from '../shared/ApiError'
import parseBearerToken from '../shared/parseBearerToken'
import TokenService, { IAccessToken } from '../services/TokenService'

class AuthMiddleware {
  req: Request
  next: NextFunction

  constructor(req: Request, next: NextFunction) {
    this.req = req
    this.next = next
  }

  /**
   * Check bearer token
   *
   * @returns
   */
  async checkAuth(isAdminCheck: boolean): Promise<void> {
    const bearer = parseBearerToken(this.req)
    if (!bearer)
      return this.next(
        new ApiError(httpStatus.UNAUTHORIZED, 'Access token required.'),
      )

    let payload: IAccessToken
    try {
      payload = TokenService.verifyAccessToken(bearer)
    } catch (e: any) {
      if (e.name === 'TokenExpiredError') {
        return this.next(
          new ApiError(httpStatus.BAD_REQUEST, 'Access token has expired.'),
        )
      }
      return this.next(
        new ApiError(httpStatus.BAD_REQUEST, 'Invalid access token'),
      )
    }

    const user = await UserModel.findById(payload.uid)
    if (!user)
      return this.next(
        new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been deleted.'),
      )

    if (isAdminCheck && !user.admin)
      return this.next(
        new ApiError(httpStatus.UNAUTHORIZED, 'You do not have access!'),
      )

    this.req.user = user

    this.next()
  }
}

export function auth(
  isAdminCheck?: boolean,
): (req: Request, res: Response, next: NextFunction) => void {
  return ca(async (req, res, next) => {
    const authentication = new AuthMiddleware(req, next)
    await authentication.checkAuth(Boolean(isAdminCheck))
  })
}
