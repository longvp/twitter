import { NextFunction } from 'express-serve-static-core'
import { Request, Response } from 'express'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { wrapRequestHandler } from '~/utils/handlers'

export const UPLOAD_DIR = path.resolve('uploads')

// Tạo thư mục uploads nếu chưa tồn tại (formidable v3 không tự tạo)
export const initUploadFolder = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

export const uploadSingleImageController = wrapRequestHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      maxFiles: 1,
      keepExtensions: true,
      // maxFileSize: 300 * 1024, // 300KB
      filename: (name, ext, part) => {
        // Giữ nguyên tên file gốc mà người dùng tải lên
        return part.originalFilename || `${name}${ext}`
      },
      filter: ({ name, mimetype }) => {
        const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
        if (!valid) {
          form.emit('error' as never, new Error('File type is not valid') as never)
        }
        return valid
      }
    })
    form.parse(req, (err, fields, files) => {
      if (err) {
        return next(err)
      }
      return res.json({ message: 'Upload success', files })
    })
  }
)
