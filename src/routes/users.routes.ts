import { Router } from 'express'
import { loginController } from '~/controllers/users.controllers'
import { loginValidator } from '~/middlewares/users.middlewares'

const router = Router()

router.post('/login', loginValidator, loginController)

export default router
