import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { userMessages } from '~/constants/messages'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schemas'
import usersService from '~/services/users.services'
import { wrapRequestHandler } from '~/utils/handlers'

export const loginController = wrapRequestHandler(async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login(user_id.toString())
  res.json({ message: userMessages.LOGIN_SUCCESS, result })
})

export const registerController = wrapRequestHandler(
  async (req: Request<ParamsDictionary, unknown, RegisterReqBody>, res: Response) => {
    const result = await usersService.register(req.body)
    res.json({ message: userMessages.REGISTER_SUCCESS, result })
  }
)
