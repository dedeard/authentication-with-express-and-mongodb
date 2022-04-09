import { expect } from 'chai'
import axios from 'axios'
import { connect, disconnect } from '../config/connect'
import User, { IUserDocument } from './user.model'

describe('User model', function () {
  let user: IUserDocument

  before(async () => {
    await connect()
    await User.deleteOne({ email: 'dede@example.com' })
  })

  it('Create a new user.', async () => {
    user = await User.create({
      name: 'dede ardiansya',
      email: 'dede@example.com',
      password: 'secret',
    })
    expect(user.password).to.not.equal('secret')
  })

  it('Hash password test.', async () => {
    expect(await user.comparePassword('secret')).to.be.true
    user.password = 'second-password'
    await user.save()
    expect(await user.comparePassword('secret')).to.be.false
    expect(await user.comparePassword('second-password')).to.be.true
  })

  it('Upload avatar test.', async () => {
    const input = (
      await axios({
        url: 'https://picsum.photos/id/237/200/300',
        responseType: 'arraybuffer',
      })
    ).data as Buffer
    const url = await user.generateAvatar(input)
    const res = await axios(url)
    expect(user.avatar).to.be.exist
    expect(res.status < 400).to.be.true
  })

  it('Delete avatar test.', async () => {
    await user.deleteAvatar()
    expect(user.avatar).to.be.undefined
  })

  it('Delete user.', async () => {
    await user.delete()
  })

  after(async () => {
    await disconnect()
  })
})
