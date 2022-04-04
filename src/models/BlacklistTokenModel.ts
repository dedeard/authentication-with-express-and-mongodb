import { prop, getModelForClass, plugin } from '@typegoose/typegoose'
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses'
import toJSON from '@meanie/mongoose-to-json'

@plugin(toJSON as any)
export class BlacklistToken extends TimeStamps {
  @prop({ required: true, unique: true })
  public token!: string

  @prop({ default: Date.now, required: true })
  public created_at!: Date
}

const BlacklistTokenModel = getModelForClass(BlacklistToken, {
  schemaOptions: {
    timestamps: false,
  },
})

export default BlacklistTokenModel
