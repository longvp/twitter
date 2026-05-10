import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schemas'
import { RegisterReqBody } from '~/models/requests/User.requests'
import databaseService from '~/services/database.service'
import { hashPassword } from '~/utils/crypto'

class UsersService {
  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        _id: new ObjectId(),
        name: payload.name,
        email: payload.email,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    return result
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}

const usersService = new UsersService()
export default usersService
