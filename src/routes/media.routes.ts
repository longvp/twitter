import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/media.controllers'
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares'

const mediaRouter = Router()

mediaRouter.post('/upload-image', accessTokenValidator, verifyUserValidator, uploadImageController)
mediaRouter.post('/upload-video', accessTokenValidator, verifyUserValidator, uploadVideoController)

export default mediaRouter
