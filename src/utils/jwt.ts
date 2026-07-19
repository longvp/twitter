import { config } from 'dotenv'
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken'

config()

export const signToken = ({
  payload,
  secret,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: object | string | Buffer
  secret: string
  options?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        throw reject(err)
      }
      return resolve(token as string)
    })
  })
}

export const verifyToken = ({
  token,
  secret,
  options = {
    algorithms: ['HS256']
  }
}: {
  token: string
  secret: string
  options?: VerifyOptions
}) => {
  return new Promise<string | object>((resolve, reject) => {
    jwt.verify(token, secret, options, (err, decoded) => {
      if (err) {
        throw reject(err)
      }
      return resolve(decoded as string | object)
    })
  })
}
