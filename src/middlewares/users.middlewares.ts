import { Request, Response, NextFunction } from 'express'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body

  if (!email) {
    res.status(400).json({ message: 'Email is required' })
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Email is invalid' })
    return
  }

  if (!password) {
    res.status(400).json({ message: 'Password is required' })
    return
  }

  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' })
    return
  }

  next()
}
