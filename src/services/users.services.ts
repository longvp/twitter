import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schemas'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import databaseService from '~/services/database.service'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { SignOptions } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import { config } from 'dotenv'
import { userMessages } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/schemas/Errors'
import httpStatus from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schemas'

config()

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      secret: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn']
      }
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      secret: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] }
    })
  }
  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }
  private signVerifyEmailToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      secret: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      payload: {
        user_id,
        token_type: TokenType.EmailVerificationToken,
        verify
      },
      options: { expiresIn: process.env.VERIFY_EMAIL_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] }
    })
  }
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      secret: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] }
    })
  }
  async register(payload: RegisterReqBody) {
    const userId = new ObjectId()
    const emailVerifyToken = await this.signVerifyEmailToken({
      user_id: userId.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: userId,
        name: payload.name,
        email: payload.email,
        username: `user${userId.toString()}`,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password),
        email_verify_token: emailVerifyToken
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: userId.toString(),
      verify: UserVerifyStatus.Unverified
    })
    databaseService.refreshTokens.insertOne(
      new RefreshToken({
        _id: new ObjectId(),
        token: refresh_token,
        createdAt: new Date(),
        user_id: new ObjectId(userId)
      })
    )
    return { access_token, refresh_token }
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    })
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

  async verifyEmail(user_id: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { email_verify_token: '', verify: UserVerifyStatus.Verified },
        $$currentDate: { updated_at: true }
      }
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Verified
    })
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        _id: new ObjectId(),
        token: refresh_token,
        createdAt: new Date(),
        user_id: new ObjectId(user_id)
      })
    )
    return {
      message: userMessages.EMAIL_VERIFICATION_SUCCESS,
      result: { access_token, refresh_token }
    }
  }

  async resendVerifyEmail(user_id: string) {
    const emailVerifyToken = await this.signVerifyEmailToken({ user_id, verify: UserVerifyStatus.Unverified })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { email_verify_token: emailVerifyToken },
        $$currentDate: { updated_at: true }
      }
    )
    return {
      message: userMessages.EMAIL_VERIFICATION_RESEND_SUCCESS,
      emailVerifyToken
    }
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgotPasswordToken = await this.signForgotPasswordToken({
      user_id: user_id,
      verify: verify
    })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { forgot_password_token: forgotPasswordToken },
        $$currentDate: { updated_at: true }
      }
    )
    return {
      message: userMessages.FORGOT_PASSWORD_EMAIL_SENT_SUCCESS,
      forgotPasswordToken
    }
  }

  async resetPassword(user_id: string, newPassword: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { password: hashPassword(newPassword) },
        $$currentDate: { updated_at: true }
      }
    )
    return {
      message: userMessages.PASSWORD_RESET_SUCCESS
    }
  }

  async getUserById(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      return null
    }
    return user
  }

  async updateUserById(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth: Date })
        },
        $$currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    const updatedUser = await this.getUserById(user_id)
    return updatedUser
  }

  async getUserByUsername(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0
        }
      }
    )
    if (!user) {
      throw new ErrorWithStatus({ message: userMessages.USER_NOT_FOUND, status: httpStatus.NOT_FOUND })
    }
    return user
  }

  async followUser(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (follower) {
      return {
        message: userMessages.FOLLOWED_ALREADY
      }
    }

    await databaseService.followers.insertOne(
      new Follower({
        _id: new ObjectId(),
        createdAt: new Date(),
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    )
    return {
      message: userMessages.FOLLOW_SUCCESS
    }
  }

  async unfollowUser(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!follower) {
      return {
        message: userMessages.ALREADY_UNFOLLOWED
      }
    }

    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    return {
      message: userMessages.UNFOLLOW_SUCCESS
    }
  }

  async changePassword(user_id: string, newPassword: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      throw new ErrorWithStatus({ message: userMessages.USER_NOT_FOUND, status: httpStatus.NOT_FOUND })
    }
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { password: hashPassword(newPassword) },
        $$currentDate: { updated_at: true }
      }
    )
    return {
      message: userMessages.PASSWORD_CHANGED_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService
