import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash'
import httpStatus from '~/constants/httpStatus'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || httpStatus.INTERNAL_SERVER_ERROR
  res.status(status).json(omit(err, ['status']))
}
