import chai from 'chai'
import chaiHttp from 'chai-http'
import axios from 'axios'
import Application from '../app'
import { connect, disconnect } from '../config/connect'
import User, { IUserDocument } from '../models/user.model'
import * as jwt from '../services/jwt.service'
import { route } from './account.route'
import * as storageService from '../services/storage.service'

chai.use(chaiHttp)

const { app } = new Application(route)
const { expect, request } = chai

const userData = {
  name: 'dede ariansya',
  email: 'dede@example.com',
  password: 'secret',
}

describe('Account route', function () {
  let user: IUserDocument
  let accessToken: string

  before(async () => {
    await connect()
    await User.deleteOne({ email: userData.email })
    user = await User.create(userData)
    accessToken = jwt.generateAccessToken(user).bearer
  })

  describe('GET /account', () => {
    it('Should be success "get profile"', (done) => {
      request(app)
        .get('/')
        .set('Authorization', 'Bearer ' + accessToken)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.body).to.own.include({ name: userData.name, email: userData.email })
          done(err)
        })
    })

    it('Should be fail with status code 401', (done) => {
      request(app)
        .get('/')
        .set('Authorization', 'Bearer fakeaccesstoken')
        .end((err, res) => {
          expect(res.status).to.equal(401)
          done(err)
        })
    })
  })

  describe('PUT /account', () => {
    it('Should be fail "update profile"', async () => {
      const req = request(app)
        .put('/')
        .set('Authorization', 'Bearer ' + accessToken)

      const req1 = req.send({ email: 'new@example.com' })
      const req2 = req.send({ newPassword: 'new-password' })
      const req3 = req.send({ email: 'new@example.com', newPassword: 'new-password' })
      const req4 = req.send({ name: 's' })
      const [res1, res2, res3, res4] = await Promise.all([req1, req2, req3, req4])

      expect(res1.status).to.equal(422)
      expect(res1.body.errors).to.have.property('password')
      expect(res2.status).to.equal(422)
      expect(res2.body.errors).to.have.property('password')
      expect(res3.status).to.equal(422)
      expect(res3.body.errors).to.have.property('password')
      expect(res4.status).to.equal(422)
      expect(res4.body.errors).to.have.property('name')
    })

    it('Should be success "update email"', (done) => {
      request(app)
        .put('/')
        .set('Authorization', 'Bearer ' + accessToken)
        .send({ email: 'mymail@example.com', password: userData.password })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.body.email).to.equal('mymail@example.com')
          done(err)
        })
    })

    it('Should be success "update password"', (done) => {
      request(app)
        .put('/')
        .set('Authorization', 'Bearer ' + accessToken)
        .send({ newPassword: 'new-password', password: userData.password })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          done(err)
        })
    })

    it('Should be success "update password email and name"', (done) => {
      request(app)
        .put('/')
        .set('Authorization', 'Bearer ' + accessToken)
        .send({ name: 'dede', email: userData.email, newPassword: userData.password, password: 'new-password' })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.body.email).to.equal(userData.email)
          expect(res.body.name).to.equal('dede')
          done(err)
        })
    })
  })

  describe('PUT /account/avatar', () => {
    it('should be success "update avatar"', (done) => {
      axios({
        url: 'https://picsum.photos/id/237/200/300',
        responseType: 'arraybuffer',
      })
        .then((res) => {
          request(app)
            .put('/avatar')
            .set('Authorization', 'Bearer ' + accessToken)
            .attach('image', res.data, 'avatar.png')
            .end((err, res2) => {
              expect(res2.status).to.equal(200)
              expect(res2.body.avatar).to.exist
              storageService
                .remove(storageService.normalizeUrl(res2.body.avatar))
                .then(() => {
                  done(err)
                })
                .catch(done)
            })
        })
        .catch(done)
    })
    it('should be fail "update avatar"', (done) => {
      request(app)
        .put('/avatar')
        .set('Authorization', 'Bearer ' + accessToken)
        .attach('image', Buffer.from('hallo world!', 'utf8'), 'avatar.png')
        .end((err, res2) => {
          expect(res2.status).to.equal(422)
          done(err)
        })
    })
  })

  after(async () => {
    await User.findByIdAndDelete(user.id)
    await disconnect()
  })
})
