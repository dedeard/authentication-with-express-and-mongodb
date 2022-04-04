import {
  prop,
  getModelForClass,
  DocumentType,
  pre,
  plugin,
  index,
  ReturnModelType,
} from '@typegoose/typegoose'
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses'
import bcrypt from 'bcrypt'
import sharp from 'sharp'
import moment from 'moment'
import toJSON from '@meanie/mongoose-to-json'
import StorageService from '../services/StorageService'

@pre<User>('save', function (next) {
  const password = this.password
  if (this.isModified('password')) {
    return bcrypt.hash(password, 10, (err, hash) => {
      if (err) return next(err)
      this.password = hash
      return next()
    })
  }
  return next()
})
@index({ name: 1 })
@plugin(toJSON as any)
export class User extends TimeStamps {
  @prop({ required: true })
  public name!: string

  @prop({ required: true, unique: true })
  public username!: string

  @prop({ required: true, unique: true })
  public email!: string

  @prop({ required: true, private: true })
  public password!: string

  @prop()
  public bio?: string

  @prop()
  public website?: string

  @prop()
  public avatar?: string

  @prop({ default: false, required: true })
  public admin!: boolean

  @prop({ default: Date.now })
  public lastLogin?: Date

  /**
   * Check password match.
   *
   * @param this
   * @param password
   * @returns
   */
  comparePassword(
    this: DocumentType<User>,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, this.password)
  }

  /**
   * Generate user avatar.
   *
   * @param this
   * @param imageBuff
   * @returns
   */
  public async generateAvatar(
    this: DocumentType<User>,
    imageBuff: Buffer,
  ): Promise<string> {
    const name = 'avatar/' + this._id + '-' + moment().unix() + '.jpg'
    await sharp(imageBuff)
      .resize({ width: 180, height: 180 })
      .toFormat('jpeg')
      .toBuffer()
      .then((buffer) => {
        return StorageService.save(name, buffer, true)
      })

    const oldAvatar = this.avatar
    this.avatar = StorageService.createUrl(name)
    await this.save()
    if (oldAvatar) {
      await StorageService.delete(StorageService.normalizeUrl(oldAvatar))
    }
    return this.avatar
  }

  /**
   * Check username exists.
   *
   * @param this
   * @param username
   * @param excludeUserId
   * @returns
   */
  static async isUsernameTaken(
    this: ReturnModelType<typeof User>,
    username: string,
    excludeUserId?: string,
  ): Promise<Boolean> {
    const count = await this.countDocuments({
      username,
      _id: { $ne: excludeUserId },
    })
    if (count > 0) {
      return true
    }
    return false
  }

  /**
   * Check email exists.
   *
   * @param this
   * @param email
   * @param excludeUserId
   * @returns
   */
  static async isEmailTaken(
    this: ReturnModelType<typeof User>,
    email: string,
    excludeUserId?: string,
  ): Promise<Boolean> {
    const count = await this.countDocuments({
      email,
      _id: { $ne: excludeUserId },
    })
    if (count > 0) {
      return true
    }
    return false
  }
}

const UserModel = getModelForClass(User, {
  schemaOptions: {
    timestamps: true,
  },
})

export default UserModel
