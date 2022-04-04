import { DocumentType } from '@typegoose/typegoose'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import config from '../config/config'
import BlacklistTokenModel from '../models/BlacklistTokenModel'
import ForgotTokenModel, { ForgotToken } from '../models/ForgotTokenModel'
import { User } from '../models/UserModel'
import strRandom from '../shared/strRandom'

export interface IRefreshToken {
  uid: string
  exp: number
}

export interface IAccessToken extends IRefreshToken {
  user: {
    id: string
    name: string
    email: string
    username: string
    admin: boolean
    avatar?: string
  }
}

class TokenService {
  /**
   * Generate access token.
   *
   * @param user
   * @returns
   */
  static generateAccessToken(user: DocumentType<User>): string {
    const payload: IAccessToken = {
      uid: user.id,
      exp: moment().add(config.jwt.access.expMinutes, 'minutes').unix(),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        admin: user.admin,
        avatar: user.avatar,
      },
    }
    return jwt.sign(payload, config.jwt.access.secret)
  }

  /**
   * Generate refresh token.
   *
   * @param user
   * @returns
   */
  static generateRefreshToken(user: DocumentType<User>): string {
    const payload: IRefreshToken = {
      uid: user.id,
      exp: moment().add(config.jwt.refresh.expDays, 'days').unix(),
    }
    return jwt.sign(payload, config.jwt.refresh.secret)
  }

  /**
   * Blacklist refresh token.
   *
   * @param token
   * @returns
   */
  static async blacklistRefreshToken(token: string): Promise<boolean> {
    const count = await BlacklistTokenModel.countDocuments({ token })
    if (count === 0) {
      await BlacklistTokenModel.create({ token })
    }
    return true
  }

  /**
   * Verify access token.
   *
   * @param token
   * @returns
   */
  static verifyAccessToken(token: string): IAccessToken {
    return jwt.verify(token, config.jwt.access.secret) as IAccessToken
  }

  /**
   * Verify refresh token.
   *
   * @param token
   * @param blacklistCheck
   * @returns
   */
  static async verifyRefreshToken(
    token: string,
    blacklistCheck: boolean | undefined = true,
  ): Promise<IRefreshToken> {
    if (blacklistCheck) {
      const count = await BlacklistTokenModel.countDocuments({ token })
      if (count > 0) {
        throw new Error('Refresh token has been blacklisted.')
      }
    }
    return jwt.verify(token, config.jwt.refresh.secret) as IRefreshToken
  }

  /**
   * Generate forgot password token.
   *
   * @param email
   * @returns
   */
  static async generateForgotPasswordToken(email: string): Promise<string> {
    const unix = String(moment().unix())
    const token = strRandom(64 - unix.length) + unix
    await ForgotTokenModel.create({
      email,
      token,
      expired_at: moment().add(config.resetPasswordExpMinutes, 'minutes'),
    })
    return token
  }

  /**
   * Verify forgot password token.
   *
   * @param token
   * @returns
   */
  static async verifyForgotPasswordToken(
    token: string,
  ): Promise<DocumentType<ForgotToken>> {
    const forgotToken = await ForgotTokenModel.findOne({ token })
    if (!forgotToken) {
      throw new Error('The token is invalid.')
    }
    if (moment(forgotToken.expired_at).diff(moment()) <= 0) {
      throw new Error('The token has expired.')
    }
    return forgotToken
  }
}

export default TokenService
