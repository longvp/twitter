import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
import usersService from '~/services/users.services'
import { wrapAsync } from '~/utils/handlers'

export const loginController = (req: Request, res: Response) => {
  // TODO: Implement login logic
  res.send('Login controller')
}

export const registerController = wrapAsync(
  async (req: Request<ParamsDictionary, unknown, RegisterReqBody>, res: Response) => {
    const emailExist = await usersService.checkEmailExist(req.body.email)
    if (emailExist) {
      res.status(400).json({ message: 'Email already exists' })
      return
    }
    const result = await usersService.register(req.body)
    res.json({ message: 'Register success', result })
  }
)
