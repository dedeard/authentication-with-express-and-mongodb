import { prop, getModelForClass, plugin } from '@typegoose/typegoose'
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses'
import toJSON from '@meanie/mongoose-to-json'

@plugin(toJSON as any)
export class ForgotToken extends TimeStamps {
  @prop({ required: true })
  public email!: string

  @prop({ required: true, unique: true })
  public token!: string

  @prop({ required: true })
  public expired_at!: Date
}

const ForgotTokenModel = getModelForClass(ForgotToken, {
  schemaOptions: {
    timestamps: false,
  },
})

export default ForgotTokenModel
