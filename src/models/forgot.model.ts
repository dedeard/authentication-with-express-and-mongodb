import { Schema, model, Document, Model } from 'mongoose'
import moment from 'moment'
import { randomBytes } from 'crypto'
import config from '../config/config'

export interface IForgot {
  email: string
  token: string
  expiredAt: Date
  createdAt?: Date
}

export interface IForgotDocument extends IForgot, Document {}

export interface IForgotModel extends Model<IForgotDocument> {
  generateForgotPasswordToken(email: string): Promise<string>
  verifyForgotPasswordToken(token: string): Promise<IForgotDocument>
}

export const ForgotSchema: Schema<IForgotDocument> = new Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiredAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
})

ForgotSchema.statics.generateForgotPasswordToken = async function (email: string): Promise<string> {
  const unix = String(moment().unix())
  const token = randomBytes(24).toString('hex') + unix
  // await this.deleteMany({ email })
  await this.create({
    email,
    token,
    expiredAt: moment().add(config.resetPasswordExpMinutes, 'minutes'),
  })
  return token
}

ForgotSchema.statics.verifyForgotPasswordToken = async function (token: string): Promise<IForgotDocument> {
  const forgotToken = await this.findOne({ token })
  if (!forgotToken) {
    throw new Error('The token is invalid.')
  }
  if (moment(forgotToken.expiredAt).diff(moment()) <= 0) {
    throw new Error('The token has expired.')
  }
  return forgotToken
}

const Forgot = model<IForgotDocument, IForgotModel>('Forgot', ForgotSchema)

export default Forgot
