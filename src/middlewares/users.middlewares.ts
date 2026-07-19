import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import { ErrorWithStatus } from '~/models/schemas/Errors'
import databaseService from '~/services/database.service'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: userMessages.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: userMessages.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 100
    },
    errorMessage: userMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_100
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
  }
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: userMessages.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: userMessages.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 100
    },
    errorMessage: userMessages.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_100
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: userMessages.PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(userMessages.CONFIRM_PASSWORD_DOES_NOT_MATCH)
      }
      return true
    }
  }
}

const forgetPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: userMessages.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: httpStatus.UNAUTHORIZED
        })
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secret: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        req.decoded_forgot_password_token = decoded_forgot_password_token
        const { user_id } = decoded_forgot_password_token as TokenPayload
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (!user) {
          throw new ErrorWithStatus({
            message: userMessages.USER_NOT_FOUND,
            status: httpStatus.NOT_FOUND
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: userMessages.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: httpStatus.UNAUTHORIZED
          })
        }
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: (error as JsonWebTokenError).message,
            status: httpStatus.UNAUTHORIZED
          })
        }
      }
      return true
    }
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: userMessages.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: userMessages.NAME_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: userMessages.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  trim: true
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    errorMessage: userMessages.DATE_OF_BIRTH_MUST_BE_ISO8601,
    options: {
      strict: true,
      strictSeparator: true
    }
  }
}

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: userMessages.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: userMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (!user) {
              throw new Error(userMessages.EMAIL_OR_PASSWORD_INCORRECT)
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: userMessages.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: userMessages.PASSWORD_MUST_BE_A_STRING
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: userMessages.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: userMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value: string) => {
            const isExist = await usersService.checkEmailExist(value)
            if (isExist) {
              throw new Error(userMessages.EMAIL_ALREADY_EXISTS)
            }
            return isExist
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secret: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              req.decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: httpStatus.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.REFRESH_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const [refresh_token_doc, decoded_refresh_token] = await Promise.all([
                databaseService.refreshTokens.findOne({ token: value }),
                verifyToken({
                  token: value,
                  secret: process.env.JWT_SECRET_REFRESH_TOKEN as string
                })
              ])
              if (!refresh_token_doc) {
                throw new ErrorWithStatus({
                  message: userMessages.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              req.decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: (error as JsonWebTokenError).message,
                  status: httpStatus.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyEmailTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secret: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              req.decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: (error as JsonWebTokenError).message,
                  status: httpStatus.UNAUTHORIZED
                })
              }
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const resendVerifyEmailValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: userMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: httpStatus.UNAUTHORIZED
              })
            }
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secret: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              req.decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: (error as JsonWebTokenError).message,
                  status: httpStatus.UNAUTHORIZED
                })
              }
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: userMessages.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: userMessages.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })
            if (!user) {
              throw new Error(userMessages.USER_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgetPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgetPasswordTokenSchema
    },
    ['body']
  )
)

export const verifyUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: userMessages.USER_NOT_VERIFIED,
        status: httpStatus.FORBIDDEN
      })
    )
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        isString: {
          errorMessage: userMessages.BIO_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            max: 500
          },
          errorMessage: userMessages.BIO_LENGTH_MUST_BE_LESS_THAN_500
        },
        trim: true
      },
      location: {
        isString: {
          errorMessage: userMessages.LOCATION_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            max: 100
          },
          errorMessage: userMessages.LOCATION_LENGTH_MUST_BE_LESS_THAN_100
        },
        trim: true
      },
      website: {
        isURL: {
          errorMessage: userMessages.WEBSITE_MUST_BE_A_VALID_URL
        },
        isLength: {
          options: {
            max: 100
          },
          errorMessage: userMessages.WEBSITE_LENGTH_MUST_BE_LESS_THAN_100
        },
        trim: true
      },
      username: {
        isString: {
          errorMessage: userMessages.USERNAME_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            max: 50
          },
          errorMessage: userMessages.USERNAME_LENGTH_MUST_BE_LESS_THAN_50
        },
        trim: true
      },
      avatar: {
        isString: {
          errorMessage: userMessages.AVATAR_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            max: 100
          },
          errorMessage: userMessages.AVATAR_LENGTH_MUST_BE_LESS_THAN_100
        },
        trim: true
      },
      cover_photo: {
        isString: {
          errorMessage: userMessages.COVER_PHOTO_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            max: 100
          },
          errorMessage: userMessages.COVER_PHOTO_LENGTH_MUST_BE_LESS_THAN_100
        },
        trim: true
      }
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: {
        notEmpty: {
          errorMessage: userMessages.USER_NOT_FOUND
        },
        isString: {
          errorMessage: userMessages.USER_NOT_FOUND
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ _id: new ObjectId(value) })
            if (!user) {
              throw new Error(userMessages.USER_NOT_FOUND)
            }
            req.followed_user_id = user._id.toString()
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: {
        notEmpty: {
          errorMessage: userMessages.USER_NOT_FOUND
        },
        isString: {
          errorMessage: userMessages.USER_NOT_FOUND
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ _id: new ObjectId(value) })
            if (!user) {
              throw new Error(userMessages.USER_NOT_FOUND)
            }
            req.user_id = user._id.toString()
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = req.decoded_authorization as TokenPayload
            const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
            if (!user) {
              throw new ErrorWithStatus({
                message: userMessages.USER_NOT_FOUND,
                status: httpStatus.NOT_FOUND
              })
            }
            if (user.password !== hashPassword(value)) {
              throw new ErrorWithStatus({
                message: userMessages.OLD_PASSWORD_IS_INCORRECT,
                status: httpStatus.UNAUTHORIZED
              })
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)
