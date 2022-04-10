import chai from 'chai'
import chaiHttp from 'chai-http'
import Application from '../app'
import { connect, disconnect } from '../config/connect'
import User from '../models/user.model'
import { route } from './users.route'

chai.use(chaiHttp)

const { app } = new Application(route)
const { expect, request } = chai

describe('Auth route', function () {
  let ids: string[] = []

  before(async () => {
    await connect()
    const user1 = await User.create({ email: 'mail1@example.com', name: 'user 1', password: 'password' })
    const user2 = await User.create({ email: 'mail2@example.com', name: 'user 2', password: 'password' })
    const user3 = await User.create({ email: 'mail3@example.com', name: 'user 2', password: 'password' })
    ids.push(user1.id)
    ids.push(user2.id)
    ids.push(user3.id)
  })

  describe('POST /users/fetch', () => {
    it('Should be success "get user by id"', (done) => {
      request(app)
        .post('/fetch')
        .send({ ids: [ids[0]] })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.body.offset).to.equal(0)
          expect(res.body.total).to.equal(1)
          done(err)
        })
    })

    it('Should be success "get users by id"', (done) => {
      request(app)
        .post('/fetch')
        .send({ ids: [ids[0], ids[1]] })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.body.offset).to.equal(0)
          expect(res.body.total).to.equal(2)
          done(err)
        })
    })

    it('Should be success "limit and offset users"', (done) => {
      request(app)
        .post('/fetch')
        .send({ limit: 2, offset: 1 })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.body.offset).to.equal(1)
          expect(res.body.total).to.equal(3)
          done(err)
        })
    })
  })

  after(async () => {
    await User.deleteMany({ _id: { $in: ids } })
    await disconnect()
  })
})
