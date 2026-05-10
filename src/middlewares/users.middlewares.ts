import { Request, Response, NextFunction } from 'express'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body

  if (!email) {
    res.status(400).json({ message: 'Email is required' })
    return
  }

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

export const registerValidator = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, confirm_password, date_of_birth } = req.body

  if (!name || typeof name !== 'string') {
    res.status(400).json({ message: 'Name is required' })
    return
  }
  if (name.length < 1 || name.length > 100) {
    res.status(400).json({ message: 'Name length must be between 1 and 100' })
    return
  }

  if (!email) {
    res.status(400).json({ message: 'Email is required' })
    return
  }
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Email is invalid' })
    return
  }

  if (!password) {
    res.status(400).json({ message: 'Password is required' })
    return
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 50) {
    res.status(400).json({ message: 'Password length must be between 6 and 50' })
    return
  }

  if (confirm_password !== password) {
    res.status(400).json({ message: 'Confirm password does not match' })
    return
  }

  if (!date_of_birth || isNaN(new Date(date_of_birth).getTime())) {
    res.status(400).json({ message: 'Date of birth is invalid (ISO 8601 expected)' })
    return
  }

  next()
}
