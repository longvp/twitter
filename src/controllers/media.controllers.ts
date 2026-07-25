import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
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

export const serveVideoStreamController = (req: Request, res: Response) => {
  const range = req.headers.range
  if (!range) {
    return res.status(httpStatus.BAD_REQUEST).send('Requires Range header')
  }

  const name = req.params.name as string
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)

  // Không tồn tại -> 404
  if (!fs.existsSync(videoPath)) {
    return res.status(httpStatus.NOT_FOUND).send('Not found')
  }

  const videoSize = fs.statSync(videoPath).size
  const CHUNK_SIZE = 10 ** 6 // ~1MB mỗi khúc
  // "bytes=1048576-" -> lấy phần start
  const start = Number(range.replace(/\D/g, ''))
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1)
  const contentLength = end - start + 1

  res.writeHead(httpStatus.PARTIAL_CONTENT, {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4'
  })

  fs.createReadStream(videoPath, { start, end }).pipe(res)
}
