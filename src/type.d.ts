import { Request } from 'express'
import User from '~/models/User.model'

declare module 'express' {
  interface Request {
    user?: User
  }
}
