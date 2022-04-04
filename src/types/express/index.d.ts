import { DocumentType } from '@typegoose/typegoose'
import { User } from '../../models/UserModel'

declare global {
  namespace Express {
    interface Request {
      user: DocumentType<User>
    }
  }
}
