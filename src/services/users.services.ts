import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schemas'
import { RegisterReqBody } from '~/models/requests/User.requests'
import databaseService from '~/services/database.service'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import { config } from 'dotenv'
import { userMessages } from '~/constants/messages'

config()

class UsersService {
  private signAccessToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
      }
    })
  }
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
      }
    })
  }
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
  }
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
    const user_id = result.insertedId.toString()
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        _id: new ObjectId(),
        token: refresh_token,
        createdAt: new Date(),
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async login(user_id: string) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id)
    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        _id: new ObjectId(),
        token: refresh_token,
        createdAt: new Date(),
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return {
      message: userMessages.LOGOUT_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService
