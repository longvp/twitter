import { Request } from 'express'
import formidable, { File } from 'formidable'
import fs from 'fs'
import path from 'path'

export const UPLOAD_IMAGE_DIR = path.resolve('uploads/images')
export const UPLOAD_IMAGE_TEMP_DIR = path.resolve('uploads/images/temp')

export const UPLOAD_VIDEO_DIR = path.resolve('uploads/videos')

// Tạo thư mục uploads nếu chưa tồn tại (formidable v3 không tự tạo)
export const initUploadFolder = () => {
  ;[UPLOAD_IMAGE_DIR, UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

export const handleUploadImage = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    // maxFileSize: 300 * 1024, // 300KB
    filename: (name, ext, part) => {
      // Giữ nguyên tên file gốc mà người dùng tải lên
      return part.originalFilename || `${name}${ext}`
    },
    filter: ({ name, mimetype }) => {
      const valid = name === 'image' && !!mimetype?.includes('image/')
      if (!valid) {
        form.emit('error' as never, new Error('File type is not valid') as never)
      }
      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.image) {
        return reject(new Error('File is empty'))
      }
      return resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    keepExtensions: true,
    // maxFileSize: 300 * 1024, // 300KB
    filename: (name, ext, part) => {
      // Giữ nguyên tên file gốc mà người dùng tải lên
      return part.originalFilename || `${name}${ext}`
    },
    filter: ({ name, mimetype }) => {
      const valid = name === 'video' && (!!mimetype?.includes('mp4') || !!mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as never, new Error('File type is not valid') as never)
      }
      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.video) {
        return reject(new Error('File is empty'))
      }
      return resolve(files.video as File[])
    })
  })
}

export const getNameFromFullname = (fullname: string) => {
  const name = fullname.split('.')
  name.pop()
  return name.join('.')
}
