import { config } from 'dotenv'
import jwt, { SignOptions } from 'jsonwebtoken'

config()

export const signToken = ({
  payload,
  secret = process.env.JWT_SECRET as string,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: object | string | Buffer
  secret?: string
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
