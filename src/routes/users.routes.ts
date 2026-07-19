import { Router } from 'express'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController,
  getMeController,
  updateMeController,
  getProfileController,
  followController,
  unfollowController,
  changePasswordController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  verifyEmailTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resendVerifyEmailValidator,
  forgotPasswordValidator,
  verifyForgotPasswordTokenValidator,
  resetPasswordValidator,
  verifyUserValidator,
  followValidator,
  unfollowValidator,
  changePasswordValidator
} from '~/middlewares/users.middlewares'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)
usersRouter.post('/register', registerValidator, registerController)
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, logoutController)
usersRouter.post('/verify-email', verifyEmailTokenValidator, verifyEmailController)
usersRouter.post('/resend-verify-email', accessTokenValidator, resendVerifyEmailValidator, resendVerifyEmailController)
usersRouter.post('/forgot-password', forgotPasswordValidator, forgotPasswordController)
usersRouter.post('/verify-forgot-password', verifyForgotPasswordTokenValidator, verifyForgotPasswordController)
usersRouter.post('/reset-password', resetPasswordValidator, resetPasswordController)
usersRouter.get('/me', accessTokenValidator, getMeController)
usersRouter.patch('/me', accessTokenValidator, verifyUserValidator, updateMeController)
usersRouter.get('/:username', getProfileController)
usersRouter.post('/follow', accessTokenValidator, verifyUserValidator, followValidator, followController)
usersRouter.delete('/follow/:user_id', accessTokenValidator, verifyUserValidator, unfollowValidator, unfollowController)
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifyUserValidator,
  changePasswordValidator,
  changePasswordController
)

export default usersRouter
