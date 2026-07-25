import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { pick } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  ForgotPasswordReqBody,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UnfollowReqBody,
  UpdateMeReqBody,
  VerifyEmailReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schemas'
import databaseService from '~/services/database.service'
import usersService from '~/services/users.services'
import { wrapRequestHandler } from '~/utils/handlers'

export const loginController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, LoginReqBody>, res: Response) => {
    const user = req.user as User
    const user_id = user._id as ObjectId
    const result = await usersService.login({
      user_id: user_id.toString(),
      verify: user.verify
    })
    return res.json({ message: userMessages.LOGIN_SUCCESS, result })
  }
)

export const oauthGoogleController = wrapRequestHandler(async (req: Request, res: Response) => {
  const { code } = req.query
  const result = await usersService.oauthGoogle(code as string)
  const urlRedirect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  return res.redirect(urlRedirect)
})

export const registerController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, RegisterReqBody>, res: Response) => {
    const result = await usersService.register(req.body)
    return res.json({ message: userMessages.REGISTER_SUCCESS, result })
  }
)

export const logoutController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, LogoutReqBody>, res: Response) => {
    const { refresh_token } = req.body
    const result = await usersService.logout(refresh_token)
    return res.json(result)
  }
)

export const refreshTokenController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, RefreshTokenReqBody>, res: Response) => {
    const { refresh_token } = req.body
    const { user_id, verify } = req.decoded_refresh_token as TokenPayload
    const result = await usersService.refreshToken({
      user_id,
      verify,
      refresh_token
    })

    return res.json({
      message: userMessages.REFRESH_TOKEN_SUCCESS,
      result
    })
  }
)

export const verifyEmailController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, VerifyEmailReqBody>, res: Response) => {
    const { user_id } = req.decoded_email_verify_token as TokenPayload
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.USER_NOT_FOUND })
    }
    if (user.email_verify_token === '') {
      return res.json({ message: userMessages.EMAIL_ALREADY_VERIFIED_BEFORE })
    }
    const result = await usersService.verifyEmail(user_id)
    return res.json({
      message: userMessages.EMAIL_VERIFICATION_SUCCESS,
      result
    })
  }
)

export const resendVerifyEmailController = wrapRequestHandler(async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.USER_NOT_FOUND })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({ message: userMessages.EMAIL_ALREADY_VERIFIED_BEFORE })
  }
  const result = await usersService.resendVerifyEmail(user_id)
  return res.json(result)
})

export const forgotPasswordController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, ForgotPasswordReqBody>, res: Response) => {
    const user = req.user as User
    const result = await usersService.forgotPassword({
      user_id: user._id.toString(),
      verify: user.verify
    })
    return res.json(result)
  }
)

export const verifyForgotPasswordController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, ForgotPasswordReqBody>, res: Response) => {
    return res.json({
      message: userMessages.FORGOT_PASSWORD_EMAIL_SENT_SUCCESS
    })
  }
)

export const resetPasswordController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, ResetPasswordReqBody>, res: Response) => {
    const { user_id } = req.decoded_forgot_password_token as TokenPayload
    const result = await usersService.resetPassword(user_id, req.body.password)
    return res.json(result)
  }
)

export const getMeController = wrapRequestHandler(async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getUserById(user_id)
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.USER_NOT_FOUND })
  }

  return res.json({ message: userMessages.GET_ME_SUCCESS, result: user })
})

export const updateMeController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, UpdateMeReqBody>, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const body = pick(req.body, [
      'name',
      'date_of_birth',
      'bio',
      'location',
      'website',
      'username',
      'avatar',
      'cover_photo'
    ])
    const user = await usersService.getUserById(user_id)
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.USER_NOT_FOUND })
    }

    const updatedUser = await usersService.updateUserById(user_id, body)
    return res.json({ message: 'Update me success', result: updatedUser })
  }
)

export const getProfileController = wrapRequestHandler(async (req: Request<{ username: string }>, res: Response) => {
  const { username } = req.params
  const user = await usersService.getUserByUsername(username)
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.USER_NOT_FOUND })
  }
  return res.json({ message: userMessages.GET_PROFILE_SUCCESS, result: user })
})

export const followController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, FollowReqBody>, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { followed_user_id } = req.body

    const result = await usersService.followUser(user_id, followed_user_id)
    return res.json(result)
  }
)

export const unfollowController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, UnfollowReqBody>, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { user_id: followed_user_id } = req.body

    const result = await usersService.unfollowUser(user_id, followed_user_id)
    return res.json(result)
  }
)

export const changePasswordController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, ChangePasswordReqBody>, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { password } = req.body

    const result = await usersService.changePassword(user_id, password)
    return res.json(result)
  }
)
