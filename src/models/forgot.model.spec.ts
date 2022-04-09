import { expect } from 'chai'
import moment from 'moment'
import { connect, disconnect } from '../config/connect'
import Forgot from './forgot.model'

describe('Forgot model', function () {
  let token: string

  before(async () => {
    await connect()
  })

  it('Generate forgot password token.', async () => {
    token = await Forgot.generateForgotPasswordToken('dede@example.com')
    expect(token).to.be.a('string')
  })

  it('Verify forgot password token.', async () => {
    const instance = await Forgot.verifyForgotPasswordToken(token)
    expect(instance.email).to.equal('dede@example.com')
  })

  it('Expired forgot password token check.', async () => {
    const instance = await Forgot.verifyForgotPasswordToken(token)
    instance.expiredAt = moment().subtract(1, 'hour').toDate()
    await instance.save()
    let error: any
    try {
      await Forgot.verifyForgotPasswordToken(token)
    } catch (e) {
      error = e
    }
    expect(error).to.exist
  })

  after(async () => {
    await disconnect()
  })
})
