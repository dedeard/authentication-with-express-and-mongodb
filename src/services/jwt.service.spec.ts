import { expect } from 'chai'
import { connect, disconnect } from '../config/connect'
import Blacklist from '../models/blacklist.model'
import User, { IUserDocument } from '../models/user.model'
import * as jwt from './jwt.service'

describe('Jwt service', function () {
  let user: IUserDocument
  let accessToken: string
  let refreshToken: string

  before(async () => {
    await connect()
    await User.deleteOne({ email: 'dede@example.com' })
    user = await User.create({
      name: 'dede ardiansya',
      email: 'dede@example.com',
      password: 'secret',
    })
  })

  it('Generate access token.', () => {
    const token = jwt.generateAccessToken(user)
    accessToken = token.bearer
    expect(token.bearer).to.be.a('string')
    expect(token.expiredAt).to.be.a('date')
  })

  it('Verify access token.', () => {
    const payload = jwt.verifyAccessToken(accessToken)
    expect(payload.user.id).to.equal(payload.uid)
    expect(payload.user.id).to.equal(user.id)
  })

  it('Generate refresh token.', () => {
    const token = jwt.generateRefreshToken(user)
    refreshToken = token.bearer
    expect(token.bearer).to.be.a('string')
    expect(token.expiredAt).to.be.a('date')
  })

  it('Verify refresh token.', async () => {
    const payload = await jwt.verifyRefreshToken(refreshToken)
    expect(payload.uid).to.equal(user.id)
  })

  it('Blacklist refresh token.', async () => {
    await jwt.blacklistRefreshToken(refreshToken)
  })

  it('Failed to Verify blacklisted refresh token.', async () => {
    let error: any
    try {
      await jwt.verifyRefreshToken(refreshToken)
    } catch (e) {
      error = e
    }
    expect(error).to.exist
  })

  it('Failed to blacklist refresh token.', async () => {
    let error: any
    try {
      await jwt.blacklistRefreshToken(refreshToken)
    } catch (e) {
      error = e
    }
    expect(error).to.exist
  })

  after(async () => {
    const { jti } = await jwt.verifyRefreshToken(refreshToken, false)
    await Blacklist.deleteOne({ jti })
    await user.delete()
    await disconnect()
  })
})
