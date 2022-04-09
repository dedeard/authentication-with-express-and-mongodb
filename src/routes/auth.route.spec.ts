import chai from 'chai'
import chaiHttp from 'chai-http'
import Application from '../app'
import { connect, disconnect } from '../config/connect'
import Forgot from '../models/forgot.model'
import User, { IUserDocument } from '../models/user.model'
import * as jwt from '../services/jwt.service'
import { route } from './auth.route'

chai.use(chaiHttp)

const { app } = new Application(route)
const { expect, request } = chai

const userData = {
  name: 'dede ariansya',
  email: 'dede@example.com',
  password: 'secret',
}

describe('Auth route', function () {
  before(async () => {
    await connect()
    await User.deleteOne({ email: userData.email })
    await Forgot.deleteMany({ email: userData.email })
  })

  describe('POST /auth/register', () => {
    it('Should be success "register"', (done) => {
      request(app)
        .post('/register')
        .send(userData)
        .end((err, res) => {
          expect(res.status).to.equal(204)
          done(err)
        })
    })

    it('Should be fail "validation error"', (done) => {
      request(app)
        .post('/register')
        .send({ name: 'dede', password: '' })
        .end((err, res) => {
          expect(res.status).to.equal(422)
          expect(res.body.errors).to.have.property('password')
          expect(res.body.errors).to.have.property('email')
          expect(res.body.errors).to.not.have.property('name')
          done(err)
        })
    })

    it('Should be fail "email already exists"', (done) => {
      request(app)
        .post('/register')
        .send(userData)
        .end((err, res) => {
          expect(res.status).to.equal(422)
          expect(res.body.errors).to.have.property('email')
          done(err)
        })
    })
  })

  describe('POST /auth/login', function () {
    it('Should be success "login"', (done) => {
      request(app)
        .post('/login')
        .send(userData)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.body.user).to.own.include({ name: userData.name, email: userData.email })
          expect(res.body.user).to.not.have.property('password')
          expect(res.body.token).to.have.keys(['access', 'refresh'])
          expect(res.body.token.access).to.have.keys(['bearer', 'expiredAt'])
          expect(res.body.token.refresh).to.have.keys(['bearer', 'expiredAt'])
          done(err)
        })
    })

    it('Should be fail "validation error"', (done) => {
      request(app)
        .post('/login')
        .send({ email: 'dede', password: '' })
        .end((err, res) => {
          expect(res.status).to.equal(422)
          expect(res.body.errors).to.have.property('password')
          expect(res.body.errors).to.have.property('email')
          expect(res.body.errors).to.not.have.property('name')
          done(err)
        })
    })

    it('Should be fail "invalid password"', (done) => {
      request(app)
        .post('/login')
        .send({ email: userData.email, password: 'fail-password' })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          done(err)
        })
    })

    it('Should be fail "invalid email"', (done) => {
      request(app)
        .post('/login')
        .send({ email: 'fail@example.com', password: userData.password })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          done(err)
        })
    })
  })

  describe('POST /auth/password', function () {
    it('should be success "send reset password link"', (done) => {
      request(app)
        .post('/password')
        .send({ email: userData.email })
        .end((err, res) => {
          expect(res.status).to.equal(204)
          done(err)
        })
    })

    it('Should be fail "validation error"', (done) => {
      request(app)
        .post('/password')
        .send({})
        .end((err, res) => {
          expect(res.status).to.equal(422)
          expect(res.body.errors).to.have.property('email')
          done(err)
        })
    })

    it('Should be fail "email is not registered"', (done) => {
      request(app)
        .post('/password')
        .send({ email: 'fake@example.com' })
        .end((err, res) => {
          expect(res.status).to.equal(422)
          expect(res.body.errors).to.have.property('email')
          done(err)
        })
    })
  })

  describe('PUT /auth/password', function () {
    it('should be fail "validation error"', (done) => {
      request(app)
        .put('/password')
        .send({ password: 'f' })
        .end((err, res) => {
          expect(res.status).to.equal(422)
          expect(res.body.errors).to.have.keys(['password', 'token'])
          done(err)
        })
    })

    it('should be fail "invalid token"', (done) => {
      request(app)
        .put('/password')
        .send({ password: 'second-password', token: 'this-is-fake-token' })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.body).to.not.have.property('errors')
          done(err)
        })
    })

    it('should be success "reset password"', async () => {
      const data = await Forgot.findOne({ email: userData.email })
      const res = await request(app).put('/password').send({ password: 'second-password', token: data?.token })
      expect(res.status).to.equal(204)
    })
  })

  describe('POST /auth/refresh-access-token', function () {
    it('should be fail "invalid refresh token"', async () => {
      const req1 = request(app).post('/refresh-access-token').send({ refreshToken: 'this-is-fake-token' })
      const req2 = request(app).post('/refresh-access-token').send({})
      const [res1, res2] = await Promise.all([req1, req2])
      expect(res1.status).to.equal(400)
      expect(res2.status).to.equal(400)
    })

    it('should be success "generate new access token"', async () => {
      const user = await User.findOne({ email: userData.email })
      const { bearer } = jwt.generateRefreshToken(user as IUserDocument)
      const res = await request(app).post('/refresh-access-token').send({ refreshToken: bearer })
      expect(res.status).to.equal(200)
      expect(res.body.accessToken).to.have.keys(['bearer', 'expiredAt'])
    })
  })

  describe('DELETE /auth/revoke-refresh-token', function () {
    let refreshToken: string

    it('should be fail "invalid refresh token"', async () => {
      const req1 = request(app).delete('/revoke-refresh-token').send({ refreshToken: 'this-is-fake-token' })
      const req2 = request(app).delete('/revoke-refresh-token').send({})
      const [res1, res2] = await Promise.all([req1, req2])
      expect(res1.status).to.equal(400)
      expect(res2.status).to.equal(400)
    })

    it('should be success "generate new access token"', async () => {
      const user = await User.findOne({ email: userData.email })
      const { bearer } = jwt.generateRefreshToken(user as IUserDocument)
      refreshToken = bearer
      const res = await request(app).delete('/revoke-refresh-token').send({ refreshToken })
      expect(res.status).to.equal(204)
    })

    it('should be fail "refresh token has been revoked"', async () => {
      const res = await request(app).post('/refresh-access-token').send({ refreshToken })
      expect(res.status).to.equal(400)
    })
  })

  after(async () => {
    await User.deleteOne({ email: userData.email })
    await Forgot.deleteMany({ email: userData.email })
    await disconnect()
  })
})
