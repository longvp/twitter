import { Router } from 'express'
import { serveImageController, serveVideoController } from '~/controllers/media.controllers'

const staticRouter = Router()

staticRouter.get('/image/:name', serveImageController)
staticRouter.get('/video-stream/:name', serveVideoController)

export default staticRouter
