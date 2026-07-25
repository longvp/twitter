import { Request, Response } from 'express'
import path from 'path'
import { wrapRequestHandler } from '~/utils/handlers'
import mediaService from '~/services/media.service'
import { userMessages } from '~/constants/messages'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/utils/file'
import httpStatus from '~/constants/httpStatus'

export const uploadImageController = wrapRequestHandler(async (req: Request, res: Response) => {
  const result = await mediaService.uploadImage(req)
  return res.json({
    result,
    message: userMessages.UPLOAD_SUCCESS
  })
})

export const uploadVideoController = wrapRequestHandler(async (req: Request, res: Response) => {
  const result = await mediaService.uploadVideo(req)
  return res.json({
    result,
    message: userMessages.UPLOAD_SUCCESS
  })
})

export const serveImageController = (req: Request, res: Response) => {
  const name = req.params.name as string
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      res.status(httpStatus.NOT_FOUND).send('Not found')
    }
  })
}

export const serveVideoController = (req: Request, res: Response) => {
  const name = req.params.name as string
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, name), (err) => {
    if (err) {
      res.status(httpStatus.NOT_FOUND).send('Not found')
    }
  })
}
