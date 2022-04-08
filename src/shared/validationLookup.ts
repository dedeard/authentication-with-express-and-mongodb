import UserModel, { User } from '../models/UserModel'
import Joi from 'joi'
import { DocumentType } from '@typegoose/typegoose'

export const uniqueEmailLookup =
  (exludeId?: string): Joi.ExternalValidationFunction =>
  async (val) => {
    const exists = await UserModel.isEmailTaken(val, exludeId)
    if (exists) {
      throw new Joi.ValidationError('"Email" already exists.', [{ message: '"Email" already exists.', context: { key: 'email' } }], val)
    }
  }

export const registeredEmailLookup =
  (exludeId?: string): Joi.ExternalValidationFunction =>
  async (val) => {
    const exists = await UserModel.isEmailTaken(val, exludeId)
    if (!exists) {
      throw new Joi.ValidationError(
        '"Email" is not registered.',
        [{ message: '"Email" is not registered.', context: { key: 'email' } }],
        val,
      )
    }
  }

export const passwordMatchLookup =
  (user: DocumentType<User>): Joi.ExternalValidationFunction =>
  (val) => {
    const match = user.comparePassword(val)
    if (!match) {
      throw new Joi.ValidationError('"Password" is not valid.', [{ message: '"Password" is not valid', context: { key: 'password' } }], val)
    }
  }
