import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'

const router = Router()

router.post('/login', loginValidator, loginController)
router.post('/register', registerValidator, registerController)

export default router
